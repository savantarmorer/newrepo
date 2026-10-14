// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {CommonBase} from "forge-std/Base.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {DracmaToken} from "../src/DracmaToken.sol";
import {AgoraReputacao} from "../src/AgoraReputacao.sol";
import {AgoraGovernor} from "../src/AgoraGovernor.sol";
import {DistribuidorRecompensas} from "../src/DistribuidorRecompensas.sol";
import {FundoMutirao} from "../src/FundoMutirao.sol";
import {VestingFundador} from "../src/VestingFundador.sol";
import {GovernorContagemAgora} from "../src/governanca/GovernorContagemAgora.sol";
import {IDracmaMintavel} from "../src/interfaces/IDracmaMintavel.sol";

/// @notice Lógica de implantação compartilhada pelos scripts (testnet/mainnet) e pelos testes.
abstract contract Implantacao is CommonBase {
    uint256 internal constant SUPPLY_MAXIMO = 100_000_000e18;
    uint256 internal constant TESOURARIA = 20_000_000e18; // 20%
    uint256 internal constant FUNDADORES = 15_000_000e18; // 15%
    uint256 internal constant FUNDO_MUTIRAO = 10_000_000e18; // 10%
    // 50% recompensas (cunhadas por época) + 5% reserva (não cunhada no MVP)

    struct Config {
        address multisig;
        address backend;
        address[] fundadores;
        uint64 vestingInicio;
        uint64 vestingDuracao;
        uint64 vestingCliff;
        uint256 timelockAtraso;
        uint48 atrasoVotacao;
        uint32 periodoVotacao;
        uint256 limiarProposta;
        uint256 quorumPercentual;
        GovernorContagemAgora.ModoVoto modo;
        uint256 inicioEpocas;
        uint256 tetoPorCarteira;
    }

    struct Implantados {
        DracmaToken token;
        AgoraReputacao reputacao;
        AgoraGovernor governor;
        TimelockController timelock;
        DistribuidorRecompensas distribuidor;
        FundoMutirao fundo;
        VestingFundador[] vestings;
    }

    error EnderecoPrevistoDivergente(address previsto, address obtido);
    error SemFundadores();

    /// @notice Parâmetros padrão (provisórios) documentados em TOKENOMICS.md
    function _configPadrao(address multisig, address backend, address[] memory fundadores)
        internal
        view
        returns (Config memory c)
    {
        c.multisig = multisig;
        c.backend = backend;
        c.fundadores = fundadores;
        c.vestingInicio = uint64(block.timestamp);
        c.vestingDuracao = 4 * 365 days;
        c.vestingCliff = 365 days;
        c.timelockAtraso = 48 hours;
        c.atrasoVotacao = 0; // snapshot = bloco de criação da proposta
        c.periodoVotacao = 302_400; // ~7 dias em blocos de 2s (Base)
        c.limiarProposta = 100e18; // 100 DRC para propor
        c.quorumPercentual = 4; // 4% do supply em circulação
        c.modo = GovernorContagemAgora.ModoVoto.Hibrido;
        c.inicioEpocas = block.timestamp;
        c.tetoPorCarteira = 2_000e18;
    }

    /// @param criador conta que executa os `new` (o broadcaster no script, o próprio teste nos testes)
    function _implantar(Config memory c, address criador) internal returns (Implantados memory d) {
        if (c.fundadores.length == 0) revert SemFundadores();

        // 1. Timelock (admin temporário = criador; renunciado no fim)
        address[] memory vazio = new address[](0);
        address[] memory executores = new address[](1); // address(0) = execução aberta
        d.timelock = new TimelockController(c.timelockAtraso, vazio, executores, criador);

        // 2. Selo de reputação
        d.reputacao = new AgoraReputacao(c.multisig, c.backend);

        // 3. Cofres de vesting dos fundadores
        d.vestings = new VestingFundador[](c.fundadores.length);
        for (uint256 i = 0; i < c.fundadores.length; i++) {
            d.vestings[i] = new VestingFundador(c.fundadores[i], c.vestingInicio, c.vestingDuracao, c.vestingCliff);
        }

        // 4. Fundo do Mutirão
        d.fundo = new FundoMutirao(address(d.timelock));

        // 5. Token (o distribuidor é implantado logo depois: endereço previsto pelo nonce)
        address distribuidorPrevisto = vm.computeCreateAddress(criador, vm.getNonce(criador) + 1);
        DracmaToken.Alocacao[] memory aloc = new DracmaToken.Alocacao[](2 + c.fundadores.length);
        aloc[0] = DracmaToken.Alocacao(address(d.timelock), TESOURARIA);
        aloc[1] = DracmaToken.Alocacao(address(d.fundo), FUNDO_MUTIRAO);
        uint256 porFundador = FUNDADORES / c.fundadores.length;
        for (uint256 i = 0; i < c.fundadores.length; i++) {
            aloc[2 + i] = DracmaToken.Alocacao(address(d.vestings[i]), porFundador);
        }
        d.token = new DracmaToken(SUPPLY_MAXIMO, c.multisig, address(d.timelock), distribuidorPrevisto, aloc);

        // 6. Distribuidor de recompensas
        d.distribuidor = new DistribuidorRecompensas(
            IDracmaMintavel(address(d.token)), d.reputacao, c.multisig, c.backend, c.inicioEpocas, c.tetoPorCarteira
        );
        if (address(d.distribuidor) != distribuidorPrevisto) {
            revert EnderecoPrevistoDivergente(distribuidorPrevisto, address(d.distribuidor));
        }

        // 7. Governor (tesouraria, fundo e vestings fora da base do quórum)
        address[] memory excluidos = new address[](2 + c.fundadores.length);
        excluidos[0] = address(d.timelock);
        excluidos[1] = address(d.fundo);
        for (uint256 i = 0; i < c.fundadores.length; i++) {
            excluidos[2 + i] = address(d.vestings[i]);
        }
        d.governor = new AgoraGovernor(
            IVotes(address(d.token)),
            d.timelock,
            d.reputacao,
            c.atrasoVotacao,
            c.periodoVotacao,
            c.limiarProposta,
            c.quorumPercentual,
            c.modo,
            excluidos
        );

        // 8. Papéis do Timelock: só o Governor propõe; Governor e multisig podem cancelar (veto de emergência)
        d.timelock.grantRole(d.timelock.PROPOSER_ROLE(), address(d.governor));
        d.timelock.grantRole(d.timelock.CANCELLER_ROLE(), address(d.governor));
        d.timelock.grantRole(d.timelock.CANCELLER_ROLE(), c.multisig);
        d.timelock.renounceRole(d.timelock.DEFAULT_ADMIN_ROLE(), criador);
    }
}

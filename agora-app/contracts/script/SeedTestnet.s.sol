// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AgoraReputacao} from "../src/AgoraReputacao.sol";
import {AgoraGovernor} from "../src/AgoraGovernor.sol";
import {DistribuidorRecompensas} from "../src/DistribuidorRecompensas.sol";
import {FundoMutirao} from "../src/FundoMutirao.sol";

/// @notice Popula a testnet com o mesmo cenário do supabase/seed.sql:
///  1) selos de reputação para as 5 carteiras de teste; 2) publica a época 1 (mesma raiz
///  Merkle do seed) e resgata para quem já "resgatou" no seed; 3) cria as duas propostas
///  on-chain com o prefixo [agora:<uuid>] que o indexador usa para ligá-las ao app.
/// @dev Requer deploy com INICIO_EPOCAS_ATRASADO=true. Usa as chaves públicas de teste do
///      Anvil — NUNCA em mainnet. BACKEND_PK deve ter EMISSOR_ROLE e PUBLICADOR_ROLE.
contract SeedTestnet is Script {
    string internal constant MNEMONICO = "test test test test test test test test test test test junk";
    bytes32 internal constant RAIZ_EPOCA_1 = 0x3ff219f855323f80319f41aed51c92e5b0e0c354e5577be351aa24e8dc0755f0;

    struct Enderecos {
        AgoraReputacao sbt;
        DistribuidorRecompensas dist;
        AgoraGovernor gov;
        address fundo;
        address token;
    }

    function run() external {
        require(block.chainid != 8453 && block.chainid != 137, "seed so em testnet");
        Enderecos memory e = _lerEnderecos();
        address[5] memory contas;
        for (uint32 i = 0; i < 5; i++) {
            contas[i] = vm.addr(vm.deriveKey(MNEMONICO, i + 1));
        }
        _selosEEpoca(e, contas);
        _propostas(e, contas);
    }

    function _lerEnderecos() internal view returns (Enderecos memory e) {
        string memory json = vm.readFile(string.concat("deployments/", vm.toString(block.chainid), ".json"));
        e.sbt = AgoraReputacao(vm.parseJsonAddress(json, ".reputacao_sbt"));
        e.dist = DistribuidorRecompensas(vm.parseJsonAddress(json, ".distribuidor"));
        e.gov = AgoraGovernor(payable(vm.parseJsonAddress(json, ".governor")));
        e.fundo = vm.parseJsonAddress(json, ".fundo_mutirao");
        e.token = vm.parseJsonAddress(json, ".token");
    }

    function _selosEEpoca(Enderecos memory e, address[5] memory contas) internal {
        uint8[5] memory niveis = [2, 4, 4, 3, 3];
        vm.startBroadcast(vm.envUint("BACKEND_PK"));
        for (uint256 i = 0; i < 5; i++) {
            if (e.sbt.tokenDe(contas[i]) == 0) e.sbt.emitir(contas[i], niveis[i]);
        }
        if (e.dist.proximaEpoca() == 1) e.dist.publicarEpoca(1, RAIZ_EPOCA_1, 629.5e18);
        // resgates relayados pelo backend (gas pago por ele, DRC vão para cada conta)
        bytes32[] memory p2 = new bytes32[](3);
        p2[0] = 0x3a5c54d8e6b92ca8dcd895fc4c3eceb8576cd97b2d35e814cff1946dddd20fd3;
        p2[1] = 0xd9a15e7a70639a8aaebab97548b8531920838768eed10287ed0cb9c3e5440fd9;
        p2[2] = 0x0125796aa6bce7f5ae9c46f6d8fab25fc1df3dc28d0a33eb1929d55e45792c60;
        if (!e.dist.resgatado(1, contas[1])) e.dist.resgatar(1, contas[1], 85.5e18, p2);
        bytes32[] memory p3 = new bytes32[](2);
        p3[0] = 0xefeac0c2f33c0188b8a9619599a1eced67bae8794cbbc3982d2e116e341994b7;
        p3[1] = 0x0125796aa6bce7f5ae9c46f6d8fab25fc1df3dc28d0a33eb1929d55e45792c60;
        if (!e.dist.resgatado(1, contas[2])) e.dist.resgatar(1, contas[2], 210e18, p3);
        bytes32[] memory p5 = new bytes32[](2);
        p5[0] = 0xc9c7bc900dcc44141ff76f35334042d94e1b57833bf171727aed186147d5ac06;
        p5[1] = 0xe3b0991a2a2086f16f10bad134dd67b6a08b21abb06648c591e753a6008e055c;
        if (!e.dist.resgatado(1, contas[4])) e.dist.resgatar(1, contas[4], 150e18, p5);
        vm.stopBroadcast();
    }

    function _propostas(Enderecos memory e, address[5] memory contas) internal {
        address[] memory alvos = new address[](1);
        uint256[] memory valores = new uint256[](1);
        bytes[] memory dados = new bytes[](1);

        // proposta 1: liberar 5.000 DRC do Fundo do Mutirão (proponente: conta 3, 210 DRC)
        alvos[0] = e.fundo;
        dados[0] =
            abi.encodeCall(FundoMutirao.liberar, (IERC20(e.token), contas[2], 5_000e18, "projeto:biblioteca-bixiga"));
        vm.startBroadcast(vm.deriveKey(MNEMONICO, 3));
        uint256 id1 = e.gov
            .propose(
                alvos,
                valores,
                dados,
                unicode"[agora:20000000-0000-4000-8000-000000000007] Liberar 5.000 DRC do Fundo do Mutirão para a Biblioteca do Bixiga"
            );
        vm.stopBroadcast();

        // proposta 2: reafirmar as contas excluídas do quórum (proponente: conta 5, 150 DRC)
        alvos[0] = address(e.gov);
        dados[0] = abi.encodeCall(AgoraGovernor.definirExcluidosDoQuorum, (e.gov.excluidosDoQuorum()));
        vm.startBroadcast(vm.deriveKey(MNEMONICO, 5));
        uint256 id2 = e.gov
            .propose(
                alvos,
                valores,
                dados,
                unicode"[agora:20000000-0000-4000-8000-000000000008] Excluir a tesouraria e os cofres de vesting do cálculo de quórum"
            );
        vm.stopBroadcast();

        console2.log("Proposta 1:", id1);
        console2.log("Proposta 2:", id2);
        console2.log("Modo de voto:", uint8(e.gov.modoVoto()));
    }
}

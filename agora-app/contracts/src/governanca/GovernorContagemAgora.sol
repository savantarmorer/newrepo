// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IAgoraReputacao} from "../interfaces/IAgoraReputacao.sol";

/// @title GovernorContagemAgora — contagem de votos com três modos de poder de voto
/// @notice
///  - Clássico:   poder = DRC delegados (1 DRC = 1 voto)
///  - Quadrático: poder = √(DRC delegados)
///  - Híbrido:    exige selo de reputação (SBT) no snapshot;
///                poder = √(DRC delegados) × multiplicador do nível (1,0 / 1,1 / 1,2 / 1,3)
///  O modo vale por proposta (gravado na criação) e só muda por proposta aprovada.
///  Quórum é medido em DRC brutos que participaram (a favor + abstenção), o que
///  mede "quanto da comunidade compareceu"; o resultado é decidido pelo poder.
/// @dev Os valores de poder ficam na escala de 18 casas: √(DRC·1e18), de forma
///      que 1 DRC corresponde a 1e18 de poder em todos os modos.
abstract contract GovernorContagemAgora is Governor {
    enum ModoVoto {
        Classico,
        Quadratico,
        Hibrido
    }

    enum TipoVoto {
        Contra,
        AFavor,
        Abstencao
    }

    struct Contagem {
        uint256 contra;
        uint256 aFavor;
        uint256 abstencao;
        uint256 participacaoBruta;
        mapping(address eleitor => bool) votou;
    }

    IAgoraReputacao public immutable reputacao;
    ModoVoto private _modoVoto;
    mapping(uint256 proposalId => ModoVoto) private _modoDaProposta;
    mapping(uint256 proposalId => Contagem) private _contagens;

    event ModoVotoAlterado(ModoVoto anterior, ModoVoto novo);

    error GovernorSemSeloDeReputacao(address eleitor);

    constructor(IAgoraReputacao reputacao_, ModoVoto modoInicial) {
        reputacao = reputacao_;
        _modoVoto = modoInicial;
        emit ModoVotoAlterado(modoInicial, modoInicial);
    }

    // ------------------------------------------------------------------ configuração (só via governança)

    function modoVoto() public view returns (ModoVoto) {
        return _modoVoto;
    }

    function modoDaProposta(uint256 proposalId) public view returns (ModoVoto) {
        return _modoDaProposta[proposalId];
    }

    /// @notice Troca o modo de voto das PRÓXIMAS propostas. Só por proposta aprovada.
    function definirModoVoto(ModoVoto novo) external onlyGovernance {
        emit ModoVotoAlterado(_modoVoto, novo);
        _modoVoto = novo;
    }

    // ------------------------------------------------------------------ leitura

    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {
        return "support=bravo&quorum=for,abstain&params=agora-poder";
    }

    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _contagens[proposalId].votou[account];
    }

    function proposalVotes(uint256 proposalId)
        public
        view
        returns (uint256 contra, uint256 aFavor, uint256 abstencao, uint256 participacaoBruta)
    {
        Contagem storage c = _contagens[proposalId];
        return (c.contra, c.aFavor, c.abstencao, c.participacaoBruta);
    }

    /// @notice Poder de voto que `conta` teria numa proposta criada agora com snapshot em `timepoint`
    function poderDeVoto(address conta, uint256 timepoint) external view returns (uint256) {
        uint256 bruto = _getVotes(conta, timepoint, "");
        uint8 nivel = _modoVoto == ModoVoto.Hibrido ? reputacao.nivelEm(conta, timepoint) : 0;
        if (_modoVoto == ModoVoto.Hibrido && nivel == 0) return 0;
        return calcularPoder(bruto, nivel, _modoVoto);
    }

    /// @notice Fórmula do poder de voto (pura, para conferência pública)
    function calcularPoder(uint256 bruto, uint8 nivel, ModoVoto modo) public pure returns (uint256) {
        if (modo == ModoVoto.Classico) return bruto;
        uint256 raiz = Math.sqrt(bruto * 1e18);
        if (modo == ModoVoto.Quadratico) return raiz;
        // Híbrido: 1,0 / 1,1 / 1,2 / 1,3 para os níveis 1..4
        uint256 n = nivel == 0 ? 1 : (nivel > 4 ? 4 : nivel);
        return (raiz * (9 + n)) / 10;
    }

    // ------------------------------------------------------------------ internos

    function _propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        address proposer
    ) internal virtual override returns (uint256 proposalId) {
        proposalId = super._propose(targets, values, calldatas, description, proposer);
        _modoDaProposta[proposalId] = _modoVoto;
    }

    function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
        return quorum(proposalSnapshot(proposalId)) <= _contagens[proposalId].participacaoBruta;
    }

    function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
        Contagem storage c = _contagens[proposalId];
        return c.aFavor > c.contra;
    }

    /// @dev `totalWeight` chega com os DRC brutos delegados no snapshot (GovernorVotes).
    function _countVote(uint256 proposalId, address account, uint8 support, uint256 totalWeight, bytes memory)
        internal
        virtual
        override
        returns (uint256 poder)
    {
        Contagem storage c = _contagens[proposalId];
        if (c.votou[account]) revert GovernorAlreadyCastVote(account);

        ModoVoto modo = _modoDaProposta[proposalId];
        uint8 nivel = 0;
        if (modo == ModoVoto.Hibrido) {
            nivel = reputacao.nivelEm(account, proposalSnapshot(proposalId));
            if (nivel == 0) revert GovernorSemSeloDeReputacao(account);
        }
        poder = calcularPoder(totalWeight, nivel, modo);
        c.votou[account] = true;

        if (support == uint8(TipoVoto.Contra)) {
            c.contra += poder;
        } else if (support == uint8(TipoVoto.AFavor)) {
            c.aFavor += poder;
            c.participacaoBruta += totalWeight;
        } else if (support == uint8(TipoVoto.Abstencao)) {
            c.abstencao += poder;
            c.participacaoBruta += totalWeight;
        } else {
            revert GovernorInvalidVoteType();
        }
    }
}

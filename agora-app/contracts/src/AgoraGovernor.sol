// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {
    GovernorVotesQuorumFraction
} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {GovernorContagemAgora} from "./governanca/GovernorContagemAgora.sol";
import {IAgoraReputacao} from "./interfaces/IAgoraReputacao.sol";

/// @title AgoraGovernor — governança on-chain da Ágora
/// @notice Decide sobre tesouraria, fundo do Mutirão, parâmetros do token, papéis
///         e contratos. Propostas aprovadas são executadas pelo Timelock (48h).
///         O snapshot do poder de voto é o bloco de criação da proposta
///         (votingDelay = 0 por padrão).
/// @dev Contrato sem upgrade. Mudanças de parâmetros passam por proposta.
contract AgoraGovernor is
    Governor,
    GovernorSettings,
    GovernorContagemAgora,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    uint256 public constant MAX_EXCLUIDOS_DO_QUORUM = 16;

    /// @dev Contas cujos votos não contam para a base do quórum (tesouraria, cofres de vesting, fundo)
    address[] private _excluidosDoQuorum;

    event ExcluidosDoQuorumAlterados(address[] contas);

    error MuitasContasExcluidas(uint256 quantidade);

    constructor(
        IVotes token,
        TimelockController timelock,
        IAgoraReputacao reputacao_,
        uint48 atrasoVotacao,
        uint32 periodoVotacao,
        uint256 limiarProposta,
        uint256 quorumPercentual,
        ModoVoto modoInicial,
        address[] memory contasExcluidas
    )
        Governor(unicode"Ágora Governor")
        GovernorSettings(atrasoVotacao, periodoVotacao, limiarProposta)
        GovernorContagemAgora(reputacao_, modoInicial)
        GovernorVotes(token)
        GovernorVotesQuorumFraction(quorumPercentual)
        GovernorTimelockControl(timelock)
    {
        _definirExcluidos(contasExcluidas);
    }

    // ------------------------------------------------------------------ quórum sobre o supply em circulação

    function excluidosDoQuorum() external view returns (address[] memory) {
        return _excluidosDoQuorum;
    }

    function definirExcluidosDoQuorum(address[] calldata contas) external onlyGovernance {
        _definirExcluidos(contas);
    }

    /// @notice Quórum = (supply no snapshot − votos das contas excluídas) × percentual
    function quorum(uint256 timepoint) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        uint256 base = token().getPastTotalSupply(timepoint);
        uint256 n = _excluidosDoQuorum.length;
        for (uint256 i = 0; i < n; i++) {
            // slither-disable-next-line calls-loop (token próprio; lista limitada a 16 contas)
            uint256 travado = token().getPastVotes(_excluidosDoQuorum[i], timepoint);
            base = travado >= base ? 0 : base - travado;
        }
        return (base * quorumNumerator(timepoint)) / quorumDenominator();
    }

    function _definirExcluidos(address[] memory contas) private {
        if (contas.length > MAX_EXCLUIDOS_DO_QUORUM) revert MuitasContasExcluidas(contas.length);
        _excluidosDoQuorum = contas;
        emit ExcluidosDoQuorumAlterados(contas);
    }

    // ------------------------------------------------------------------ resolução de herança

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        address proposer
    ) internal override(Governor, GovernorContagemAgora) returns (uint256) {
        return super._propose(targets, values, calldatas, description, proposer);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}

// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

/// @notice Interface mínima do selo de reputação usada pelo Governor e pelo Distribuidor
interface IAgoraReputacao {
    /// @notice Nível (0 = sem selo, 1..4) do membro no `timepoint` (bloco) informado
    function nivelEm(address membro, uint256 timepoint) external view returns (uint8);

    /// @notice Nível atual (0 = sem selo)
    function nivelDe(address membro) external view returns (uint8);

    function balanceOf(address membro) external view returns (uint256);
}

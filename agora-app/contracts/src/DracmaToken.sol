// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {IDracmaMintavel} from "./interfaces/IDracmaMintavel.sol";

/// @title Dracma (DRC) — token de governança e reconhecimento da Ágora
/// @notice Supply máximo fixo. Novos DRC só nascem pelo DistribuidorRecompensas
///         (contribuições verificadas) ou pelo Timelock (decisão da DAO).
/// @dev Quem só pode conceder MINTER_ROLE é o MINTER_ADMIN_ROLE, que pertence
///      exclusivamente ao Timelock: nem a multisig consegue criar novos emissores.
///      Toda conta que recebe DRC sem ter delegado é auto-delegada a si mesma,
///      para que o poder de voto funcione sem passo extra (inclusive em smart accounts).
contract DracmaToken is ERC20, ERC20Permit, ERC20Votes, ERC20Capped, AccessControl, Pausable, IDracmaMintavel {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant MINTER_ADMIN_ROLE = keccak256("MINTER_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct Alocacao {
        address destino;
        uint256 valor;
    }

    error EnderecoInvalido();

    /// @param cap_ supply máximo (18 casas decimais)
    /// @param multisig Safe 3-de-5: administra pausas e papéis não monetários
    /// @param timelock TimelockController da DAO (emissor e administrador de emissores)
    /// @param distribuidor DistribuidorRecompensas (emissor por épocas)
    /// @param alocacoes alocações iniciais (tesouraria, vesting dos fundadores, fundo do Mutirão)
    constructor(
        uint256 cap_,
        address multisig,
        address timelock,
        address distribuidor,
        Alocacao[] memory alocacoes
    ) ERC20("Dracma", "DRC") ERC20Permit("Dracma") ERC20Capped(cap_) {
        if (multisig == address(0) || timelock == address(0) || distribuidor == address(0)) revert EnderecoInvalido();

        _setRoleAdmin(MINTER_ROLE, MINTER_ADMIN_ROLE);
        _setRoleAdmin(MINTER_ADMIN_ROLE, MINTER_ADMIN_ROLE);
        _grantRole(MINTER_ADMIN_ROLE, timelock);
        _grantRole(MINTER_ROLE, timelock);
        _grantRole(MINTER_ROLE, distribuidor);
        _grantRole(DEFAULT_ADMIN_ROLE, multisig);
        _grantRole(PAUSER_ROLE, multisig);

        for (uint256 i = 0; i < alocacoes.length; i++) {
            if (alocacoes[i].destino == address(0)) revert EnderecoInvalido();
            _mint(alocacoes[i].destino, alocacoes[i].valor);
        }
    }

    function mint(address para, uint256 valor) external onlyRole(MINTER_ROLE) {
        _mint(para, valor);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ------------------------------------------------------------------ internos

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes, ERC20Capped)
        whenNotPaused
    {
        super._update(from, to, value);
        if (to != address(0) && delegates(to) == address(0)) {
            _delegate(to, to);
        }
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}

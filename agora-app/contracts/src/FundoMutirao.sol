// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title FundoMutirao — cofre do fundo filantrópico (10% do supply)
/// @notice Pertence ao Timelock: cada liberação exige proposta aprovada na
///         Assembleia on-chain e registra o projeto beneficiado.
contract FundoMutirao is Ownable {
    using SafeERC20 for IERC20;

    event Liberacao(address indexed token, address indexed destino, uint256 valor, string referenciaProjeto);

    error ReferenciaObrigatoria();

    constructor(address timelock) Ownable(timelock) {}

    function liberar(IERC20 token, address destino, uint256 valor, string calldata referenciaProjeto)
        external
        onlyOwner
    {
        if (bytes(referenciaProjeto).length == 0) revert ReferenciaObrigatoria();
        emit Liberacao(address(token), destino, valor, referenciaProjeto);
        token.safeTransfer(destino, valor);
    }
}

// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {VestingWallet} from "@openzeppelin/contracts/finance/VestingWallet.sol";
import {VestingWalletCliff} from "@openzeppelin/contracts/finance/VestingWalletCliff.sol";

/// @title VestingFundador — vesting linear de 4 anos com cliff de 1 ano
/// @dev Wrapper concreto do VestingWalletCliff da OpenZeppelin.
contract VestingFundador is VestingWalletCliff {
    constructor(address beneficiario, uint64 inicio, uint64 duracao, uint64 cliff)
        VestingWallet(beneficiario, inicio, duracao)
        VestingWalletCliff(cliff)
    {}
}

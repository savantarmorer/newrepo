// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FundoMutirao} from "../src/FundoMutirao.sol";
import {VestingFundador} from "../src/VestingFundador.sol";

contract FundoEVestingTest is BaseTest {
    function test_fundoSoLiberaPorGovernanca() public {
        IERC20 drc = IERC20(address(d.token));
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, multisig));
        vm.prank(multisig);
        d.fundo.liberar(drc, alice, 1e18, "projeto:x");

        vm.prank(address(d.timelock));
        vm.expectRevert(FundoMutirao.ReferenciaObrigatoria.selector);
        d.fundo.liberar(drc, alice, 1e18, "");

        vm.expectEmit(address(d.fundo));
        emit FundoMutirao.Liberacao(address(drc), alice, 1e18, "projeto:abrigo");
        vm.prank(address(d.timelock));
        d.fundo.liberar(drc, alice, 1e18, "projeto:abrigo");
        assertEq(drc.balanceOf(alice), 1e18);
        assertEq(d.fundo.owner(), address(d.timelock));
    }

    function test_vestingQuatroAnosComCliff() public {
        VestingFundador v = d.vestings[0];
        address token = address(d.token);
        uint256 total = d.token.balanceOf(address(v));
        assertEq(v.owner(), fundadores[0]);
        assertEq(v.cliff(), v.start() + 365 days);
        assertEq(v.duration(), 4 * 365 days);

        vm.warp(v.start() + 365 days - 1);
        assertEq(v.releasable(token), 0, "nada antes do cliff");

        vm.warp(v.start() + 365 days);
        assertApproxEqAbs(v.releasable(token), total / 4, 1e6, "25% no cliff");

        vm.warp(v.start() + 2 * 365 days);
        v.release(token);
        assertApproxEqAbs(d.token.balanceOf(fundadores[0]), total / 2, 1e6, "50% em 2 anos");

        vm.warp(v.start() + 4 * 365 days);
        v.release(token);
        assertEq(d.token.balanceOf(fundadores[0]), total, "100% em 4 anos");
    }
}

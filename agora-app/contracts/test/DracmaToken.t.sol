// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {DracmaToken} from "../src/DracmaToken.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract DracmaTokenTest is BaseTest {
    function test_alocacoesIniciais() public view {
        assertEq(d.token.name(), "Dracma");
        assertEq(d.token.symbol(), "DRC");
        assertEq(d.token.cap(), 100_000_000e18);
        assertEq(d.token.balanceOf(address(d.timelock)), 20_000_000e18, "tesouraria 20%");
        assertEq(d.token.balanceOf(address(d.fundo)), 10_000_000e18, "fundo do Mutirao 10%");
        uint256 fundadores_;
        for (uint256 i = 0; i < d.vestings.length; i++) {
            fundadores_ += d.token.balanceOf(address(d.vestings[i]));
        }
        assertEq(fundadores_, 15_000_000e18, "fundadores 15%");
        assertEq(d.token.totalSupply(), 45_000_000e18, "recompensas e reserva nao sao pre-cunhadas");
    }

    function test_papeisDeEmissao() public view {
        bytes32 minter = d.token.MINTER_ROLE();
        assertTrue(d.token.hasRole(minter, address(d.distribuidor)));
        assertTrue(d.token.hasRole(minter, address(d.timelock)));
        assertFalse(d.token.hasRole(minter, multisig));
        assertFalse(d.token.hasRole(minter, backend));
        assertEq(d.token.getRoleAdmin(minter), d.token.MINTER_ADMIN_ROLE());
        assertTrue(d.token.hasRole(d.token.MINTER_ADMIN_ROLE(), address(d.timelock)));
    }

    function test_multisigNaoCriaEmissores() public {
        bytes32 minter = d.token.MINTER_ROLE();
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, multisig, d.token.MINTER_ADMIN_ROLE()
            )
        );
        vm.prank(multisig);
        d.token.grantRole(minter, multisig);
    }

    function test_somenteEmissorCunha() public {
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, d.token.MINTER_ROLE())
        );
        vm.prank(alice);
        d.token.mint(alice, 1);

        vm.prank(address(d.timelock));
        d.token.mint(alice, 5e18);
        assertEq(d.token.balanceOf(alice), 5e18);
    }

    function test_capNaoPodeSerUltrapassado() public {
        uint256 restante = d.token.cap() - d.token.totalSupply();
        vm.startPrank(address(d.timelock));
        d.token.mint(alice, restante);
        vm.expectRevert(abi.encodeWithSelector(ERC20Capped.ERC20ExceededCap.selector, d.token.cap() + 1, d.token.cap()));
        d.token.mint(alice, 1);
        vm.stopPrank();
    }

    function testFuzz_cunhagemNuncaPassaDoCap(uint256 a, uint256 b) public {
        a = bound(a, 0, type(uint128).max);
        b = bound(b, 0, type(uint128).max);
        vm.startPrank(address(d.timelock));
        try d.token.mint(alice, a) {} catch {}
        try d.token.mint(bruno, b) {} catch {}
        vm.stopPrank();
        assertLe(d.token.totalSupply(), d.token.cap());
    }

    function test_autoDelegacaoAoReceber() public {
        vm.prank(address(d.timelock));
        d.token.mint(alice, 10e18);
        assertEq(d.token.delegates(alice), alice);
        assertEq(d.token.getVotes(alice), 10e18);

        vm.prank(alice);
        d.token.transfer(bruno, 4e18);
        assertEq(d.token.getVotes(alice), 6e18);
        assertEq(d.token.getVotes(bruno), 4e18);
    }

    function test_delegacaoExplicitaPrevalece() public {
        vm.prank(address(d.timelock));
        d.token.mint(alice, 10e18);
        vm.prank(alice);
        d.token.delegate(bruno);
        assertEq(d.token.getVotes(bruno), 10e18);
        assertEq(d.token.getVotes(alice), 0);
        vm.prank(address(d.timelock));
        d.token.mint(alice, 1e18);
        assertEq(d.token.delegates(alice), bruno, "nao re-delega automaticamente");
        assertEq(d.token.getVotes(bruno), 11e18);
    }

    function test_pausaBloqueiaTransferenciasECunhagem() public {
        vm.prank(address(d.timelock));
        d.token.mint(alice, 10e18);

        vm.expectRevert();
        vm.prank(alice);
        d.token.pause();

        vm.prank(multisig);
        d.token.pause();
        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(alice);
        d.token.transfer(bruno, 1);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(address(d.timelock));
        d.token.mint(alice, 1);

        vm.prank(multisig);
        d.token.unpause();
        vm.prank(alice);
        d.token.transfer(bruno, 1);
        assertEq(d.token.balanceOf(bruno), 1);
    }

    function test_permit() public {
        (address dono, uint256 chave) = makeAddrAndKey("dono");
        vm.prank(address(d.timelock));
        d.token.mint(dono, 10e18);
        uint256 prazo = block.timestamp + 1 hours;
        bytes32 tipo = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
        bytes32 estrutura = keccak256(abi.encode(tipo, dono, bruno, 3e18, d.token.nonces(dono), prazo));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", d.token.DOMAIN_SEPARATOR(), estrutura));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(chave, digest);
        d.token.permit(dono, bruno, 3e18, prazo, v, r, s);
        assertEq(d.token.allowance(dono, bruno), 3e18);
        assertEq(d.token.nonces(dono), 1);
    }

    function test_construtorRejeitaEnderecosZero() public {
        DracmaToken.Alocacao[] memory vazio = new DracmaToken.Alocacao[](0);
        vm.expectRevert(DracmaToken.EnderecoInvalido.selector);
        new DracmaToken(1e18, address(0), alice, bruno, vazio);

        DracmaToken.Alocacao[] memory ruim = new DracmaToken.Alocacao[](1);
        ruim[0] = DracmaToken.Alocacao(address(0), 1);
        vm.expectRevert(DracmaToken.EnderecoInvalido.selector);
        new DracmaToken(1e18, alice, bruno, carla, ruim);
    }
}

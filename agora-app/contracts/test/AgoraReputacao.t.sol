// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {AgoraReputacao, IERC5192} from "../src/AgoraReputacao.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract AgoraReputacaoTest is BaseTest {
    function test_emitirUmPorMembro() public {
        _emitirSelo(alice, 2);
        assertEq(d.reputacao.balanceOf(alice), 1);
        assertEq(d.reputacao.nivelDe(alice), 2);
        uint256 id = d.reputacao.tokenDe(alice);
        assertEq(d.reputacao.ownerOf(id), alice);
        assertTrue(d.reputacao.locked(id));

        vm.expectRevert(abi.encodeWithSelector(AgoraReputacao.JaPossuiSelo.selector, alice));
        vm.prank(backend);
        d.reputacao.emitir(alice, 3);
    }

    function test_somenteEmissor() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, alice, d.reputacao.EMISSOR_ROLE()
            )
        );
        vm.prank(alice);
        d.reputacao.emitir(alice, 4);
    }

    function test_niveisValidos() public {
        vm.startPrank(backend);
        vm.expectRevert(abi.encodeWithSelector(AgoraReputacao.NivelInvalido.selector, 0));
        d.reputacao.emitir(alice, 0);
        vm.expectRevert(abi.encodeWithSelector(AgoraReputacao.NivelInvalido.selector, 5));
        d.reputacao.emitir(alice, 5);
        vm.expectRevert(abi.encodeWithSelector(AgoraReputacao.SemSelo.selector, alice));
        d.reputacao.atualizarNivel(alice, 2);
        vm.expectRevert(abi.encodeWithSelector(AgoraReputacao.SemSelo.selector, alice));
        d.reputacao.revogar(alice);
        vm.stopPrank();
    }

    function test_intransferivel() public {
        _emitirSelo(alice, 1);
        uint256 id = d.reputacao.tokenDe(alice);
        vm.startPrank(alice);
        vm.expectRevert(AgoraReputacao.Intransferivel.selector);
        d.reputacao.transferFrom(alice, bruno, id);
        vm.expectRevert(AgoraReputacao.Intransferivel.selector);
        d.reputacao.safeTransferFrom(alice, bruno, id);
        vm.expectRevert(AgoraReputacao.Intransferivel.selector);
        d.reputacao.approve(bruno, id);
        vm.expectRevert(AgoraReputacao.Intransferivel.selector);
        d.reputacao.setApprovalForAll(bruno, true);
        vm.stopPrank();
    }

    function test_historicoDeNiveisPorBloco() public {
        _emitirSelo(alice, 1);
        uint256 b1 = block.number;
        vm.roll(b1 + 10);
        vm.prank(backend);
        d.reputacao.atualizarNivel(alice, 3);
        uint256 b2 = block.number;
        vm.roll(b2 + 10);

        assertEq(d.reputacao.nivelEm(alice, b1 - 1), 0, "antes do selo");
        assertEq(d.reputacao.nivelEm(alice, b1), 1);
        assertEq(d.reputacao.nivelEm(alice, b2 - 1), 1);
        assertEq(d.reputacao.nivelEm(alice, b2), 3);
        assertEq(d.reputacao.nivelDe(alice), 3);

        vm.expectRevert(
            abi.encodeWithSelector(AgoraReputacao.ConsultaFutura.selector, block.number, uint48(block.number))
        );
        d.reputacao.nivelEm(alice, block.number);
    }

    function test_revogar() public {
        _emitirSelo(alice, 4);
        uint256 id = d.reputacao.tokenDe(alice);
        vm.roll(block.number + 1);
        vm.prank(backend);
        d.reputacao.revogar(alice);
        assertEq(d.reputacao.balanceOf(alice), 0);
        assertEq(d.reputacao.nivelDe(alice), 0);
        assertEq(d.reputacao.tokenDe(alice), 0);
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, id));
        d.reputacao.locked(id);
        // pode receber um novo selo depois
        _emitirSelo(alice, 1);
        assertEq(d.reputacao.nivelDe(alice), 1);
    }

    function test_metadadosOnChain() public {
        _emitirSelo(alice, 4);
        string memory uri = d.reputacao.tokenURI(d.reputacao.tokenDe(alice));
        assertGt(bytes(uri).length, 40);
        assertEq(_prefixo(uri, 29), "data:application/json;base64,");
        _emitirSelo(bruno, 3);
        _emitirSelo(carla, 2);
        _emitirSelo(diego, 1);
        assertGt(bytes(d.reputacao.tokenURI(d.reputacao.tokenDe(bruno))).length, 40);
        assertGt(bytes(d.reputacao.tokenURI(d.reputacao.tokenDe(carla))).length, 40);
        assertGt(bytes(d.reputacao.tokenURI(d.reputacao.tokenDe(diego))).length, 40);
    }

    function test_interfaces() public view {
        assertTrue(d.reputacao.supportsInterface(type(IERC5192).interfaceId));
        assertTrue(d.reputacao.supportsInterface(type(IERC721).interfaceId));
        assertTrue(d.reputacao.supportsInterface(type(IAccessControl).interfaceId));
        assertFalse(d.reputacao.supportsInterface(0xdeadbeef));
        assertEq(d.reputacao.clock(), uint48(block.number));
    }

    function testFuzz_nivelSempreEntre0e4(uint8 nivel) public {
        vm.prank(backend);
        if (nivel == 0 || nivel > 4) {
            vm.expectRevert(abi.encodeWithSelector(AgoraReputacao.NivelInvalido.selector, nivel));
            d.reputacao.emitir(alice, nivel);
        } else {
            d.reputacao.emitir(alice, nivel);
            assertEq(d.reputacao.nivelDe(alice), nivel);
        }
    }

    function _prefixo(string memory s, uint256 n) private pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory r = new bytes(n);
        for (uint256 i = 0; i < n; i++) {
            r[i] = b[i];
        }
        return string(r);
    }
}

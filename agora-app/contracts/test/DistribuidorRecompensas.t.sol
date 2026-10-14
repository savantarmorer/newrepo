// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {DistribuidorRecompensas} from "../src/DistribuidorRecompensas.sol";
import {IDracmaMintavel} from "../src/interfaces/IDracmaMintavel.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract DistribuidorRecompensasTest is BaseTest {
    address[4] internal contas;
    uint256[4] internal valores = [uint256(120e18), 85.5e18, 210e18, 64e18];

    function setUp() public override {
        super.setUp();
        contas = [alice, bruno, carla, diego];
        for (uint256 i = 0; i < 4; i++) {
            _emitirSelo(contas[i], uint8(1 + (i % 4)));
        }
    }

    function test_emissaoDecrescenteSomaCinquentaMilhoes() public view {
        uint256 soma;
        for (uint256 e = 1; e <= 5 * 52; e++) {
            soma += d.distribuidor.tetoDaEpoca(e);
        }
        assertApproxEqAbs(soma, 50_000_000e18, 1e6, "50% do supply em 5 anos");
        assertGt(d.distribuidor.tetoDaEpoca(1), d.distribuidor.tetoDaEpoca(53), "emissao decrescente");
        assertGt(d.distribuidor.tetoDaEpoca(53), d.distribuidor.tetoDaEpoca(105));
        assertGt(d.distribuidor.tetoDaEpoca(105), d.distribuidor.tetoDaEpoca(157));
        assertGt(d.distribuidor.tetoDaEpoca(157), d.distribuidor.tetoDaEpoca(209));
        assertEq(d.distribuidor.tetoDaEpoca(261), 0, "acabou depois de 5 anos");
        assertEq(d.distribuidor.tetoDaEpoca(0), 0);
    }

    function test_publicarEResgatar() public {
        bytes32[][] memory provas = _publicar(1, contas, valores);
        for (uint256 i = 0; i < 4; i++) {
            // qualquer um envia (relayer/paymaster); os DRC vão para a conta da folha
            vm.prank(makeAddr("relayer"));
            d.distribuidor.resgatar(1, contas[i], valores[i], provas[i]);
            assertEq(d.token.balanceOf(contas[i]), valores[i]);
            assertTrue(d.distribuidor.resgatado(1, contas[i]));
        }
        (, uint128 total, uint128 resgatado) = d.distribuidor.epocas(1);
        assertEq(total, resgatado);
    }

    function test_resgateDuploImpossivel() public {
        bytes32[][] memory provas = _publicar(1, contas, valores);
        d.distribuidor.resgatar(1, alice, valores[0], provas[0]);
        vm.expectRevert(abi.encodeWithSelector(DistribuidorRecompensas.JaResgatado.selector, 1, alice));
        d.distribuidor.resgatar(1, alice, valores[0], provas[0]);
    }

    function test_provaInvalida() public {
        bytes32[][] memory provas = _publicar(1, contas, valores);
        vm.expectRevert(DistribuidorRecompensas.ProvaInvalida.selector);
        d.distribuidor.resgatar(1, alice, valores[0] + 1, provas[0]);
        vm.expectRevert(DistribuidorRecompensas.ProvaInvalida.selector);
        d.distribuidor.resgatar(1, alice, valores[1], provas[1]);
    }

    function test_semSeloNaoResgata() public {
        address[4] memory c = [alice, bruno, carla, semSelo];
        bytes32[][] memory provas = _publicar(1, c, valores);
        vm.expectRevert(abi.encodeWithSelector(DistribuidorRecompensas.SemSeloDeReputacao.selector, semSelo));
        d.distribuidor.resgatar(1, semSelo, valores[3], provas[3]);
    }

    function test_tetoPorCarteira() public {
        uint256[4] memory v = [uint256(2_001e18), 1e18, 1e18, 1e18];
        bytes32[][] memory provas = _publicar(1, contas, v);
        vm.expectRevert(abi.encodeWithSelector(DistribuidorRecompensas.AcimaDoTetoPorCarteira.selector, 2_001e18, 2_000e18));
        d.distribuidor.resgatar(1, alice, v[0], provas[0]);
    }

    function test_regrasDePublicacao() public {
        (bytes32 raiz,) = _arvore4(contas, valores);
        vm.startPrank(backend);
        vm.expectRevert(abi.encodeWithSelector(DistribuidorRecompensas.EpocaForaDeOrdem.selector, 1, 2));
        d.distribuidor.publicarEpoca(2, raiz, 1);
        vm.expectRevert(
            abi.encodeWithSelector(DistribuidorRecompensas.EpocaNaoTerminou.selector, 1, d.distribuidor.fimDaEpoca(1))
        );
        d.distribuidor.publicarEpoca(1, raiz, 1);
        vm.warp(d.distribuidor.fimDaEpoca(1));
        vm.expectRevert(DistribuidorRecompensas.RaizInvalida.selector);
        d.distribuidor.publicarEpoca(1, bytes32(0), 1);
        uint256 teto = d.distribuidor.tetoDaEpoca(1);
        vm.expectRevert(abi.encodeWithSelector(DistribuidorRecompensas.AcimaDoTetoDaEpoca.selector, teto + 1, teto));
        d.distribuidor.publicarEpoca(1, raiz, teto + 1);
        vm.stopPrank();

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, alice, d.distribuidor.PUBLICADOR_ROLE()
            )
        );
        vm.prank(alice);
        d.distribuidor.publicarEpoca(1, raiz, 1);
    }

    function test_epocaNaoPublicada() public {
        bytes32[] memory vazia = new bytes32[](0);
        vm.expectRevert(abi.encodeWithSelector(DistribuidorRecompensas.EpocaNaoPublicada.selector, 7));
        d.distribuidor.resgatar(7, alice, 1, vazia);
    }

    function test_arvoreMalformadaNaoEmiteAlemDoTotal() public {
        // total publicado menor que a soma das folhas: o último resgate é recusado
        (bytes32 raiz, bytes32[][] memory provas) = _arvore4(contas, valores);
        vm.warp(d.distribuidor.fimDaEpoca(1));
        vm.prank(backend);
        d.distribuidor.publicarEpoca(1, raiz, valores[0] + valores[1]);
        d.distribuidor.resgatar(1, alice, valores[0], provas[0]);
        d.distribuidor.resgatar(1, bruno, valores[1], provas[1]);
        vm.expectRevert(DistribuidorRecompensas.ParametrosInconsistentes.selector);
        d.distribuidor.resgatar(1, carla, valores[2], provas[2]);
    }

    function test_resgatarVarias() public {
        bytes32[][] memory p1 = _publicar(1, contas, valores);
        bytes32[][] memory p2 = _publicar(2, contas, valores);
        uint256[] memory eps = new uint256[](2);
        eps[0] = 1;
        eps[1] = 2;
        uint256[] memory vals = new uint256[](2);
        vals[0] = valores[2];
        vals[1] = valores[2];
        bytes32[][] memory provas = new bytes32[][](2);
        provas[0] = p1[2];
        provas[1] = p2[2];
        d.distribuidor.resgatarVarias(eps, carla, vals, provas);
        assertEq(d.token.balanceOf(carla), 2 * valores[2]);

        uint256[] memory curto = new uint256[](1);
        vm.expectRevert(DistribuidorRecompensas.ParametrosInconsistentes.selector);
        d.distribuidor.resgatarVarias(eps, carla, curto, provas);
    }

    function test_pausa() public {
        bytes32[][] memory provas = _publicar(1, contas, valores);
        vm.prank(multisig);
        d.distribuidor.pause();
        vm.expectRevert(Pausable.EnforcedPause.selector);
        d.distribuidor.resgatar(1, alice, valores[0], provas[0]);
        vm.prank(multisig);
        d.distribuidor.unpause();
        d.distribuidor.resgatar(1, alice, valores[0], provas[0]);
    }

    function test_tetoPorCarteiraConfiguravel() public {
        vm.prank(multisig);
        d.distribuidor.definirTetoPorCarteira(5_000e18);
        assertEq(d.distribuidor.tetoPorCarteira(), 5_000e18);
        uint256 maximo = d.distribuidor.tetoDaEpoca(1);
        vm.startPrank(multisig);
        vm.expectRevert(DistribuidorRecompensas.TetoInvalido.selector);
        d.distribuidor.definirTetoPorCarteira(0);
        vm.expectRevert(DistribuidorRecompensas.TetoInvalido.selector);
        d.distribuidor.definirTetoPorCarteira(maximo + 1);
        vm.stopPrank();
    }

    function test_poolDaComunidadeEsgota() public {
        // força a soma publicada até o limite do pool com várias épocas no teto
        DistribuidorRecompensas dist = new DistribuidorRecompensas(
            IDracmaMintavel(address(d.token)), d.reputacao, multisig, backend, block.timestamp, 1_000e18
        );
        uint256 publicado;
        uint256 e = 1;
        vm.startPrank(backend);
        while (publicado < 50_000_000e18 && e <= 260) {
            uint256 teto = dist.tetoDaEpoca(e);
            vm.warp(dist.fimDaEpoca(e));
            dist.publicarEpoca(e, keccak256(abi.encode(e)), teto);
            publicado += teto;
            e++;
        }
        vm.warp(dist.fimDaEpoca(e));
        vm.expectRevert(abi.encodeWithSelector(DistribuidorRecompensas.AcimaDoTetoDaEpoca.selector, 1, 0));
        dist.publicarEpoca(e, keccak256("x"), 1);
        vm.stopPrank();
        assertLe(dist.totalPublicado(), dist.POOL_COMUNIDADE());
    }

    /// @notice Compatibilidade com @openzeppelin/merkle-tree (mesma árvore do seed.sql)
    function test_compatibilidadeComArvoreDoBackend() public {
        address conta = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
        _emitirSelo(conta, 4);
        vm.warp(d.distribuidor.fimDaEpoca(1));
        vm.prank(backend);
        d.distribuidor.publicarEpoca(1, 0x3ff219f855323f80319f41aed51c92e5b0e0c354e5577be351aa24e8dc0755f0, 629.5e18);
        bytes32[] memory prova = new bytes32[](2);
        prova[0] = 0xefeac0c2f33c0188b8a9619599a1eced67bae8794cbbc3982d2e116e341994b7;
        prova[1] = 0x0125796aa6bce7f5ae9c46f6d8fab25fc1df3dc28d0a33eb1929d55e45792c60;
        d.distribuidor.resgatar(1, conta, 210e18, prova);
        assertEq(d.token.balanceOf(conta), 210e18);
    }

    function testFuzz_resgateRespeitaFolha(uint96 v0, uint96 v1, uint96 v2, uint96 v3, uint256 tentativa) public {
        uint256[4] memory v = [uint256(v0) % 2_000e18 + 1, uint256(v1) % 2_000e18 + 1, uint256(v2) % 2_000e18 + 1, uint256(v3) % 2_000e18 + 1];
        bytes32[][] memory provas = _publicar(1, contas, v);
        uint256 i = tentativa % 4;
        uint256 errado = v[i] + 1 + (tentativa % 1e18);
        vm.expectRevert();
        d.distribuidor.resgatar(1, contas[i], errado, provas[i]);
        d.distribuidor.resgatar(1, contas[i], v[i], provas[i]);
        assertEq(d.token.balanceOf(contas[i]), v[i]);
        assertLe(d.token.totalSupply(), d.token.cap());
    }
}

// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BaseTest} from "./Base.t.sol";
import {DracmaToken} from "../src/DracmaToken.sol";
import {DistribuidorRecompensas} from "../src/DistribuidorRecompensas.sol";
import {AgoraReputacao} from "../src/AgoraReputacao.sol";
import {AgoraGovernor} from "../src/AgoraGovernor.sol";
import {GovernorContagemAgora} from "../src/governanca/GovernorContagemAgora.sol";

/// @notice Ator aleatório: publica épocas, resgata (inclusive em dobro), cunha pelo
///         timelock, transfere e tenta votar sem selo no modo híbrido.
contract Ator is Test {
    DracmaToken internal token;
    DistribuidorRecompensas internal dist;
    AgoraReputacao internal rep;
    address internal backend;
    address internal timelock;

    address[4] internal contas;
    mapping(uint256 epoca => uint256[4]) internal valores;
    mapping(uint256 epoca => bytes32[4][2]) internal provasAux; // [i][nivel]

    uint256 public resgatesDuplosAceitos;
    uint256 public somaResgatada;
    uint256 public somaPublicada;
    uint256 public ultimaEpoca;

    constructor(DracmaToken t, DistribuidorRecompensas d_, AgoraReputacao r, address b, address tl) {
        token = t;
        dist = d_;
        rep = r;
        backend = b;
        timelock = tl;
        for (uint256 i = 0; i < 4; i++) {
            contas[i] = address(uint160(0xA000 + i));
            vm.prank(backend);
            rep.emitir(contas[i], uint8(1 + i));
        }
    }

    function _folha(address c, uint256 v) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(c, v))));
    }

    function _par(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encode(a, b)) : keccak256(abi.encode(b, a));
    }

    function publicar(uint256 s0, uint256 s1, uint256 s2, uint256 s3) external {
        uint256 e = dist.proximaEpoca();
        if (e > 30) return;
        uint256[4] memory v = [s0 % 2_000e18 + 1, s1 % 2_000e18 + 1, s2 % 2_000e18 + 1, s3 % 2_000e18 + 1];
        bytes32 f0 = _folha(contas[0], v[0]);
        bytes32 f1 = _folha(contas[1], v[1]);
        bytes32 f2 = _folha(contas[2], v[2]);
        bytes32 f3 = _folha(contas[3], v[3]);
        bytes32 n01 = _par(f0, f1);
        bytes32 n23 = _par(f2, f3);
        valores[e] = v;
        provasAux[e] = [[f1, f0, f3, f2], [n23, n23, n01, n01]];
        if (block.timestamp < dist.fimDaEpoca(e)) vm.warp(dist.fimDaEpoca(e));
        vm.prank(backend);
        dist.publicarEpoca(e, _par(n01, n23), v[0] + v[1] + v[2] + v[3]);
        somaPublicada += v[0] + v[1] + v[2] + v[3];
        ultimaEpoca = e;
    }

    function resgatar(uint256 sorteioEpoca, uint256 sorteioConta) external {
        if (ultimaEpoca == 0) return;
        uint256 e = 1 + (sorteioEpoca % ultimaEpoca);
        uint256 i = sorteioConta % 4;
        bytes32[] memory prova = new bytes32[](2);
        prova[0] = provasAux[e][0][i];
        prova[1] = provasAux[e][1][i];
        bool jaTinha = dist.resgatado(e, contas[i]);
        try dist.resgatar(e, contas[i], valores[e][i], prova) {
            if (jaTinha) resgatesDuplosAceitos++;
            somaResgatada += valores[e][i];
        } catch {}
    }

    function cunharPeloTimelock(uint256 valor) external {
        valor = bound(valor, 0, 10_000_000e18);
        vm.prank(timelock);
        try token.mint(contas[valor % 4], valor) {} catch {}
    }

    function transferir(uint256 de, uint256 para, uint256 valor) external {
        address origem = contas[de % 4];
        valor = bound(valor, 0, token.balanceOf(origem));
        vm.prank(origem);
        token.transfer(contas[para % 4], valor);
    }
}

contract InvariantesTest is BaseTest {
    Ator internal ator;

    function setUp() public override {
        super.setUp();
        ator = new Ator(d.token, d.distribuidor, d.reputacao, backend, address(d.timelock));
        targetContract(address(ator));
    }

    /// supply nunca acima do cap
    function invariant_supplyNuncaAcimaDoCap() public view {
        assertLe(d.token.totalSupply(), d.token.cap());
    }

    /// claim duplo impossível
    function invariant_semResgateDuplo() public view {
        assertEq(ator.resgatesDuplosAceitos(), 0);
    }

    /// resgates nunca superam o publicado e o publicado nunca supera o pool
    function invariant_resgatadoLimitadoAoPublicado() public view {
        assertLe(ator.somaResgatada(), ator.somaPublicada());
        assertLe(d.distribuidor.totalPublicado(), d.distribuidor.POOL_COMUNIDADE());
    }

    /// votos delegados somados nunca superam o supply
    function invariant_votosNaoSuperamSupply() public view {
        uint256 soma;
        for (uint256 i = 0; i < 4; i++) {
            soma += d.token.getVotes(address(uint160(0xA000 + i)));
        }
        assertLe(soma, d.token.totalSupply());
    }
}

/// voto sem selo sempre rejeitado no modo híbrido (fuzz de contas e níveis)
contract HibridoSemSeloTest is BaseTest {
    function testFuzz_votoSemSeloRejeitado(address eleitor, uint96 saldo) public {
        vm.assume(eleitor != address(0) && eleitor.code.length == 0 && d.reputacao.balanceOf(eleitor) == 0);
        vm.assume(eleitor != alice);
        uint256 s = bound(uint256(saldo), 1e18, 1_000_000e18);
        vm.prank(address(d.timelock));
        d.token.mint(eleitor, s);
        vm.prank(address(d.timelock));
        d.token.mint(alice, 1_000e18);
        vm.roll(block.number + 1);

        address[] memory a = new address[](1);
        a[0] = address(d.governor);
        uint256[] memory v = new uint256[](1);
        bytes[] memory c = new bytes[](1);
        c[0] = abi.encodeCall(GovernorContagemAgora.definirModoVoto, (GovernorContagemAgora.ModoVoto.Hibrido));
        vm.prank(alice);
        uint256 id = d.governor.propose(a, v, c, "fuzz");
        vm.roll(block.number + 1);
        vm.expectRevert(abi.encodeWithSelector(GovernorContagemAgora.GovernorSemSeloDeReputacao.selector, eleitor));
        vm.prank(eleitor);
        d.governor.castVote(id, 1);
    }
}

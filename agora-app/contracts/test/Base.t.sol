// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Implantacao} from "../script/Implantacao.sol";
import {GovernorContagemAgora} from "../src/governanca/GovernorContagemAgora.sol";

/// @notice Implanta o sistema completo como no script e oferece utilitários Merkle.
abstract contract BaseTest is Test, Implantacao {
    Implantados internal d;
    Config internal cfg;

    address internal multisig = makeAddr("multisig");
    address internal backend = makeAddr("backend");
    address internal alice = makeAddr("alice");
    address internal bruno = makeAddr("bruno");
    address internal carla = makeAddr("carla");
    address internal diego = makeAddr("diego");
    address internal semSelo = makeAddr("semSelo");
    address[] internal fundadores;

    function setUp() public virtual {
        vm.warp(1_760_000_000);
        vm.roll(1_000);
        fundadores.push(makeAddr("fundador1"));
        fundadores.push(makeAddr("fundador2"));
        fundadores.push(makeAddr("fundador3"));
        cfg = _configPadrao(multisig, backend, fundadores);
        cfg.periodoVotacao = 100;
        cfg.inicioEpocas = block.timestamp;
        Implantados memory implantados = _implantar(cfg, address(this));
        d.token = implantados.token;
        d.reputacao = implantados.reputacao;
        d.governor = implantados.governor;
        d.timelock = implantados.timelock;
        d.distribuidor = implantados.distribuidor;
        d.fundo = implantados.fundo;
        for (uint256 i = 0; i < implantados.vestings.length; i++) {
            d.vestings.push(implantados.vestings[i]);
        }
    }

    // ------------------------------------------------------------------ utilitários

    function _emitirSelo(address membro, uint8 nivel) internal {
        vm.prank(backend);
        d.reputacao.emitir(membro, nivel);
    }

    function _folha(address conta, uint256 valor) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(conta, valor))));
    }

    function _hashPar(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encode(a, b)) : keccak256(abi.encode(b, a));
    }

    /// @dev Árvore de 4 folhas (pares ordenados, compatível com MerkleProof da OZ)
    function _arvore4(address[4] memory contas, uint256[4] memory valores)
        internal
        pure
        returns (bytes32 raiz, bytes32[][] memory provas)
    {
        bytes32[4] memory f;
        for (uint256 i = 0; i < 4; i++) {
            f[i] = _folha(contas[i], valores[i]);
        }
        bytes32 n01 = _hashPar(f[0], f[1]);
        bytes32 n23 = _hashPar(f[2], f[3]);
        raiz = _hashPar(n01, n23);
        provas = new bytes32[][](4);
        for (uint256 i = 0; i < 4; i++) {
            provas[i] = new bytes32[](2);
            provas[i][0] = f[i ^ 1];
            provas[i][1] = i < 2 ? n23 : n01;
        }
    }

    /// @dev Publica uma época de 4 contas e devolve as provas
    function _publicar(uint256 epoca, address[4] memory contas, uint256[4] memory valores)
        internal
        returns (bytes32[][] memory provas)
    {
        bytes32 raiz;
        (raiz, provas) = _arvore4(contas, valores);
        uint256 total = valores[0] + valores[1] + valores[2] + valores[3];
        vm.warp(d.distribuidor.fimDaEpoca(epoca));
        vm.prank(backend);
        d.distribuidor.publicarEpoca(epoca, raiz, total);
    }

    /// @dev Dá DRC a quem precisa votar (via época de recompensas) e avança um bloco
    function _distribuirParaVotantes(uint256[4] memory valores) internal {
        address[4] memory contas = [alice, bruno, carla, diego];
        bytes32[][] memory provas = _publicar(d.distribuidor.proximaEpoca(), contas, valores);
        uint256 epoca = d.distribuidor.proximaEpoca() - 1;
        for (uint256 i = 0; i < 4; i++) {
            d.distribuidor.resgatar(epoca, contas[i], valores[i], provas[i]);
        }
        vm.roll(block.number + 1);
    }

    function _modo(uint8 m) internal pure returns (GovernorContagemAgora.ModoVoto) {
        return GovernorContagemAgora.ModoVoto(m);
    }
}

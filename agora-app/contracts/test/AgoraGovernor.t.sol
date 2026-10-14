// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {BaseTest} from "./Base.t.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {GovernorContagemAgora} from "../src/governanca/GovernorContagemAgora.sol";
import {AgoraGovernor} from "../src/AgoraGovernor.sol";
import {FundoMutirao} from "../src/FundoMutirao.sol";

contract AgoraGovernorTest is BaseTest {
    address internal destino = makeAddr("bibliotecaBixiga");

    function setUp() public override {
        super.setUp();
        _emitirSelo(alice, 4);
        _emitirSelo(bruno, 1);
        _emitirSelo(carla, 2);
        _emitirSelo(diego, 1);
        _distribuirParaVotantes([uint256(1_600e18), 400e18, 900e18, 1_000e18]);
        // diego perde o selo (ex.: assinatura cancelada) e fica só com os DRC
        vm.prank(backend);
        d.reputacao.revogar(diego);
        vm.roll(block.number + 1);
    }

    // ------------------------------------------------------------------ utilitários

    function _propostaLiberarFundo(uint256 valor)
        internal
        view
        returns (address[] memory alvos, uint256[] memory valores, bytes[] memory dados, string memory descricao)
    {
        alvos = new address[](1);
        alvos[0] = address(d.fundo);
        valores = new uint256[](1);
        dados = new bytes[](1);
        dados[0] = abi.encodeCall(FundoMutirao.liberar, (IERC20(address(d.token)), destino, valor, "projeto:biblioteca"));
        descricao = "[agora:20000000-0000-4000-8000-000000000007] Liberar DRC do Fundo do Mutirao";
    }

    function _propor(uint256 valor) internal returns (uint256 id) {
        (address[] memory a, uint256[] memory v, bytes[] memory c, string memory desc) = _propostaLiberarFundo(valor);
        vm.prank(alice);
        id = d.governor.propose(a, v, c, desc);
        vm.roll(block.number + 1);
    }

    function _executar(uint256 valor) internal {
        (address[] memory a, uint256[] memory v, bytes[] memory c, string memory desc) = _propostaLiberarFundo(valor);
        bytes32 h = keccak256(bytes(desc));
        d.governor.queue(a, v, c, h);
        vm.warp(block.timestamp + 48 hours + 1);
        d.governor.execute(a, v, c, h);
    }

    function _alterarModoPorGovernanca(GovernorContagemAgora.ModoVoto modo) internal {
        address[] memory a = new address[](1);
        a[0] = address(d.governor);
        uint256[] memory v = new uint256[](1);
        bytes[] memory c = new bytes[](1);
        c[0] = abi.encodeCall(GovernorContagemAgora.definirModoVoto, (modo));
        string memory desc = string.concat("trocar modo ", vm.toString(uint8(modo)));
        vm.prank(alice);
        uint256 id = d.governor.propose(a, v, c, desc);
        vm.roll(block.number + 1);
        vm.prank(alice);
        d.governor.castVote(id, 1);
        vm.prank(carla);
        d.governor.castVote(id, 1);
        vm.roll(block.number + cfg.periodoVotacao + 1);
        bytes32 h = keccak256(bytes(desc));
        d.governor.queue(a, v, c, h);
        vm.warp(block.timestamp + 48 hours + 1);
        d.governor.execute(a, v, c, h);
        assertEq(uint8(d.governor.modoVoto()), uint8(modo));
    }

    // ------------------------------------------------------------------ testes

    function test_parametros() public view {
        assertEq(d.governor.votingDelay(), 0, "snapshot no bloco de criacao");
        assertEq(d.governor.votingPeriod(), cfg.periodoVotacao);
        assertEq(d.governor.proposalThreshold(), 100e18);
        assertEq(uint8(d.governor.modoVoto()), uint8(GovernorContagemAgora.ModoVoto.Hibrido), "hibrido por padrao");
        assertEq(d.governor.timelock(), address(d.timelock));
        assertEq(d.timelock.getMinDelay(), 48 hours);
        assertEq(d.governor.excluidosDoQuorum().length, 2 + fundadores.length);
        assertEq(d.governor.COUNTING_MODE(), "support=bravo&quorum=for,abstain&params=agora-poder");
    }

    function test_cicloCompletoLiberaFundoDoMutirao() public {
        uint256 id = _propor(5_000e18);
        assertEq(d.governor.proposalSnapshot(id), block.number - 1, "snapshot = bloco da criacao");
        assertEq(uint8(d.governor.state(id)), uint8(IGovernor.ProposalState.Active));

        vm.prank(alice);
        d.governor.castVote(id, 1);
        vm.prank(carla);
        d.governor.castVoteWithReason(id, 1, "a biblioteca precisa");
        vm.prank(bruno);
        d.governor.castVote(id, 0);
        assertTrue(d.governor.hasVoted(id, alice));

        vm.roll(block.number + cfg.periodoVotacao + 1);
        assertEq(uint8(d.governor.state(id)), uint8(IGovernor.ProposalState.Succeeded));
        assertTrue(d.governor.proposalNeedsQueuing(id));

        _executar(5_000e18);
        assertEq(uint8(d.governor.state(id)), uint8(IGovernor.ProposalState.Executed));
        assertEq(d.token.balanceOf(destino), 5_000e18);
    }

    function test_timelockSegura48h() public {
        uint256 id = _propor(1e18);
        vm.prank(alice);
        d.governor.castVote(id, 1);
        vm.roll(block.number + cfg.periodoVotacao + 1);
        (address[] memory a, uint256[] memory v, bytes[] memory c, string memory desc) = _propostaLiberarFundo(1e18);
        bytes32 h = keccak256(bytes(desc));
        d.governor.queue(a, v, c, h);
        assertEq(uint8(d.governor.state(id)), uint8(IGovernor.ProposalState.Queued));
        vm.warp(block.timestamp + 47 hours);
        vm.expectRevert();
        d.governor.execute(a, v, c, h);
    }

    function test_hibridoRejeitaVotoSemSelo() public {
        uint256 id = _propor(1e18);
        vm.expectRevert(abi.encodeWithSelector(GovernorContagemAgora.GovernorSemSeloDeReputacao.selector, diego));
        vm.prank(diego);
        d.governor.castVote(id, 1);
    }

    function test_poderHibridoComMultiplicadorDeNivel() public {
        uint256 id = _propor(1e18);
        vm.prank(alice); // 1.600 DRC, nível 4 → √1600 × 1,3 = 52
        d.governor.castVote(id, 1);
        vm.prank(bruno); // 400 DRC, nível 1 → √400 × 1,0 = 20
        d.governor.castVote(id, 0);
        vm.prank(carla); // 900 DRC, nível 2 → √900 × 1,1 = 33
        d.governor.castVote(id, 2);
        (uint256 contra, uint256 aFavor, uint256 abstencao, uint256 bruto) = d.governor.proposalVotes(id);
        assertEq(aFavor, 52e18);
        assertEq(contra, 20e18);
        assertEq(abstencao, 33e18);
        assertEq(bruto, 2_500e18, "quorum medido em DRC brutos (a favor + abstencao)");
    }

    function test_quadratico() public {
        _alterarModoPorGovernanca(GovernorContagemAgora.ModoVoto.Quadratico);
        uint256 id = _propor(1e18);
        vm.prank(diego); // sem selo pode votar no quadrático: √1000 ≈ 31,62
        d.governor.castVote(id, 1);
        (, uint256 aFavor,,) = d.governor.proposalVotes(id);
        assertApproxEqAbs(aFavor, 31.6227766e18, 1e12);
        assertEq(uint8(d.governor.modoDaProposta(id)), uint8(GovernorContagemAgora.ModoVoto.Quadratico));
    }

    function test_classico() public {
        _alterarModoPorGovernanca(GovernorContagemAgora.ModoVoto.Classico);
        uint256 id = _propor(1e18);
        vm.prank(diego);
        d.governor.castVote(id, 1);
        vm.prank(bruno);
        d.governor.castVote(id, 0);
        (uint256 contra, uint256 aFavor,,) = d.governor.proposalVotes(id);
        assertEq(aFavor, 1_000e18, "1 DRC = 1 voto");
        assertEq(contra, 400e18);
    }

    function test_modoSoMudaPorGovernanca() public {
        vm.expectRevert(abi.encodeWithSelector(IGovernor.GovernorOnlyExecutor.selector, multisig));
        vm.prank(multisig);
        d.governor.definirModoVoto(GovernorContagemAgora.ModoVoto.Classico);
    }

    function test_modoValePorProposta() public {
        uint256 id = _propor(1e18); // criada no híbrido
        _alterarModoPorGovernanca(GovernorContagemAgora.ModoVoto.Classico);
        assertEq(uint8(d.governor.modoDaProposta(id)), uint8(GovernorContagemAgora.ModoVoto.Hibrido));
    }

    function test_snapshotIgnoraDRCRecebidosDepois() public {
        uint256 id = _propor(1e18);
        vm.prank(address(d.timelock));
        d.token.mint(bruno, 10_000e18); // recebidos após o snapshot
        vm.roll(block.number + 1);
        vm.prank(bruno);
        d.governor.castVote(id, 1);
        (, uint256 aFavor,,) = d.governor.proposalVotes(id);
        assertEq(aFavor, 20e18, "conta o saldo do snapshot");
    }

    function test_nivelDoSnapshotPrevalece() public {
        uint256 id = _propor(1e18);
        vm.prank(backend);
        d.reputacao.atualizarNivel(bruno, 4);
        vm.roll(block.number + 1);
        vm.prank(bruno);
        d.governor.castVote(id, 1);
        (, uint256 aFavor,,) = d.governor.proposalVotes(id);
        assertEq(aFavor, 20e18, "nivel 1 no snapshot");
    }

    function test_votoDuploEVotoInvalido() public {
        uint256 id = _propor(1e18);
        vm.startPrank(alice);
        d.governor.castVote(id, 1);
        vm.expectRevert();
        d.governor.castVote(id, 0);
        vm.stopPrank();
        vm.expectRevert(IGovernor.GovernorInvalidVoteType.selector);
        vm.prank(carla);
        d.governor.castVote(id, 3);
    }

    function test_quorumExcluiTesourariaEVestings() public {
        uint256 id = _propor(1e18);
        uint256 snap = d.governor.proposalSnapshot(id);
        uint256 circulante = d.token.getPastTotalSupply(snap) - 45_000_000e18;
        assertEq(d.governor.quorum(snap), (circulante * 4) / 100, "4% do supply em circulacao");
        assertEq(circulante, 3_900e18);
    }

    function test_semQuorumDerrota() public {
        uint256 id = _propor(1e18);
        // ninguém vota: quórum não é atingido
        vm.roll(block.number + cfg.periodoVotacao + 1);
        assertEq(uint8(d.governor.state(id)), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_maioriaContraDerrota() public {
        uint256 id = _propor(1e18);
        vm.prank(bruno);
        d.governor.castVote(id, 1); // 20
        vm.prank(alice);
        d.governor.castVote(id, 0); // 52
        vm.roll(block.number + cfg.periodoVotacao + 1);
        assertEq(uint8(d.governor.state(id)), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_limiarDeProposta() public {
        (address[] memory a, uint256[] memory v, bytes[] memory c,) = _propostaLiberarFundo(1e18);
        address pobre = makeAddr("pobre");
        vm.expectRevert(abi.encodeWithSelector(IGovernor.GovernorInsufficientProposerVotes.selector, pobre, 0, 100e18));
        vm.prank(pobre);
        d.governor.propose(a, v, c, "sem DRC");
    }

    function test_excluidosDoQuorumPorGovernanca() public {
        address[] memory novos = new address[](1);
        novos[0] = address(d.timelock);
        vm.expectRevert();
        d.governor.definirExcluidosDoQuorum(novos);

        address[] memory a = new address[](1);
        a[0] = address(d.governor);
        uint256[] memory v = new uint256[](1);
        bytes[] memory c = new bytes[](1);
        c[0] = abi.encodeCall(AgoraGovernor.definirExcluidosDoQuorum, (novos));
        vm.prank(alice);
        uint256 id = d.governor.propose(a, v, c, "excluidos");
        vm.roll(block.number + 1);
        vm.prank(alice);
        d.governor.castVote(id, 1);
        vm.roll(block.number + cfg.periodoVotacao + 1);
        d.governor.queue(a, v, c, keccak256("excluidos"));
        vm.warp(block.timestamp + 48 hours + 1);
        d.governor.execute(a, v, c, keccak256("excluidos"));
        assertEq(d.governor.excluidosDoQuorum().length, 1);
        assertEq(d.governor.excluidosDoQuorum()[0], address(d.timelock));
    }

    function test_quorumNuncaNegativo() public {
        // se as contas excluídas somam mais que o supply (delegações cruzadas), quórum = 0
        uint256 id = _propor(1e18);
        uint256 snap = d.governor.proposalSnapshot(id);
        assertGt(d.governor.quorum(snap), 0);
    }

    function test_poderDeVotoConsultavel() public view {
        uint256 t = block.number - 1;
        assertEq(d.governor.poderDeVoto(alice, t), 52e18);
        assertEq(d.governor.poderDeVoto(diego, t), 0, "sem selo, sem poder no hibrido");
        assertEq(d.governor.calcularPoder(100e18, 0, GovernorContagemAgora.ModoVoto.Hibrido), 10e18);
        assertEq(d.governor.calcularPoder(100e18, 9, GovernorContagemAgora.ModoVoto.Hibrido), 13e18);
    }

    function test_multisigPodeCancelarNaFila() public {
        uint256 id = _propor(1e18);
        vm.prank(alice);
        d.governor.castVote(id, 1);
        vm.roll(block.number + cfg.periodoVotacao + 1);
        (address[] memory a, uint256[] memory v, bytes[] memory c, string memory desc) = _propostaLiberarFundo(1e18);
        d.governor.queue(a, v, c, keccak256(bytes(desc)));
        bytes32 opId = d.timelock.hashOperationBatch(a, v, c, 0, bytes20(address(d.governor)) ^ keccak256(bytes(desc)));
        vm.prank(multisig);
        d.timelock.cancel(opId);
        assertEq(uint8(d.governor.state(id)), uint8(IGovernor.ProposalState.Canceled));
    }

    function test_proponenteCancelaEnquantoPendente() public {
        (address[] memory a, uint256[] memory v, bytes[] memory c, string memory desc) = _propostaLiberarFundo(1e18);
        vm.prank(alice);
        uint256 id = d.governor.propose(a, v, c, desc);
        assertEq(uint8(d.governor.state(id)), uint8(IGovernor.ProposalState.Pending));
        vm.prank(alice);
        d.governor.cancel(a, v, c, keccak256(bytes(desc)));
        assertEq(uint8(d.governor.state(id)), uint8(IGovernor.ProposalState.Canceled));
    }

    function test_limiteDeContasExcluidas() public {
        address[] memory muitas = new address[](17);
        vm.expectRevert(abi.encodeWithSelector(AgoraGovernor.MuitasContasExcluidas.selector, 17));
        new AgoraGovernor(
            d.token, d.timelock, d.reputacao, 0, 100, 1, 4, GovernorContagemAgora.ModoVoto.Hibrido, muitas
        );
    }

    function testFuzz_poderNuncaSuperaClassicoParaGrandesSaldos(uint128 bruto, uint8 nivel) public view {
        uint256 b = uint256(bruto) + 2e18; // a partir de 2 DRC a raiz é menor que o saldo
        uint256 q = d.governor.calcularPoder(b, 0, GovernorContagemAgora.ModoVoto.Quadratico);
        uint256 h = d.governor.calcularPoder(b, nivel, GovernorContagemAgora.ModoVoto.Hibrido);
        assertLe(q, b);
        assertLe(h, (q * 13) / 10 + 1);
        assertGe(h, q);
    }
}

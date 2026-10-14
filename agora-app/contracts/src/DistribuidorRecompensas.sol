// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IDracmaMintavel} from "./interfaces/IDracmaMintavel.sol";
import {IAgoraReputacao} from "./interfaces/IAgoraReputacao.sol";

/// @title DistribuidorRecompensas — recompensas por contribuição, em épocas semanais
/// @notice O backend fecha cada época, calcula quanto cada membro recebe a partir da
///         reputação verificada (artigos, revisões, horas confirmadas…) e publica a
///         raiz Merkle. Qualquer pessoa pode enviar o resgate de uma conta (os DRC vão
///         sempre para a conta da folha), o que permite gas patrocinado por paymaster
///         ou por um relayer, sem custo para o membro.
/// @dev Emissão decrescente: 50% do supply (50M DRC) em 5 anos, com orçamento anual
///      de 16M, 12M, 10M, 7M e 5M (1/52 por semana). Créditos não resgatados não são
///      cunhados e não expiram. Folhas no formato StandardMerkleTree da OpenZeppelin:
///      keccak256(bytes.concat(keccak256(abi.encode(conta, valor)))).
contract DistribuidorRecompensas is AccessControl, Pausable {
    bytes32 public constant PUBLICADOR_ROLE = keccak256("PUBLICADOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant DURACAO_EPOCA = 1 weeks;
    uint256 public constant EPOCAS_POR_ANO = 52;
    uint256 public constant POOL_COMUNIDADE = 50_000_000e18;

    struct Epoca {
        bytes32 raiz;
        uint128 total;
        uint128 resgatado;
    }

    IDracmaMintavel public immutable token;
    IAgoraReputacao public immutable reputacao;
    /// @notice Início da época 1
    uint256 public immutable inicio;

    uint256 public proximaEpoca = 1;
    uint256 public totalPublicado;
    uint256 public tetoPorCarteira;

    mapping(uint256 epoca => Epoca) public epocas;
    mapping(uint256 epoca => mapping(address conta => bool)) public resgatado;

    event EpocaPublicada(uint256 indexed epoca, bytes32 raiz, uint256 total);
    event Resgate(uint256 indexed epoca, address indexed conta, uint256 valor);
    event TetoPorCarteiraAlterado(uint256 anterior, uint256 novo);

    error EpocaForaDeOrdem(uint256 esperada, uint256 recebida);
    error EpocaNaoTerminou(uint256 epoca, uint256 terminaEm);
    error EpocaNaoPublicada(uint256 epoca);
    error RaizInvalida();
    error AcimaDoTetoDaEpoca(uint256 total, uint256 teto);
    error AcimaDoPool(uint256 total, uint256 disponivel);
    error AcimaDoTetoPorCarteira(uint256 valor, uint256 teto);
    error JaResgatado(uint256 epoca, address conta);
    error ProvaInvalida();
    error SemSeloDeReputacao(address conta);
    error TetoInvalido();
    error ParametrosInconsistentes();

    constructor(
        IDracmaMintavel token_,
        IAgoraReputacao reputacao_,
        address admin,
        address publicador,
        uint256 inicio_,
        uint256 tetoPorCarteira_
    ) {
        token = token_;
        reputacao = reputacao_;
        inicio = inicio_;
        _definirTeto(tetoPorCarteira_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(PUBLICADOR_ROLE, publicador);
    }

    // ------------------------------------------------------------------ emissão programada

    /// @notice Orçamento máximo da época (1-indexada). Zero depois de 5 anos.
    function tetoDaEpoca(uint256 epoca) public pure returns (uint256) {
        if (epoca == 0) return 0;
        uint256 ano = (epoca - 1) / EPOCAS_POR_ANO;
        uint256 anual;
        if (ano == 0) anual = 16_000_000e18;
        else if (ano == 1) anual = 12_000_000e18;
        else if (ano == 2) anual = 10_000_000e18;
        else if (ano == 3) anual = 7_000_000e18;
        else if (ano == 4) anual = 5_000_000e18;
        else return 0;
        return anual / EPOCAS_POR_ANO;
    }

    function fimDaEpoca(uint256 epoca) public view returns (uint256) {
        return inicio + epoca * DURACAO_EPOCA;
    }

    // ------------------------------------------------------------------ publicação

    function publicarEpoca(uint256 epoca, bytes32 raiz, uint256 total)
        external
        onlyRole(PUBLICADOR_ROLE)
        whenNotPaused
    {
        if (epoca != proximaEpoca) revert EpocaForaDeOrdem(proximaEpoca, epoca);
        // forge-lint: disable-next-line(block-timestamp) granularidade de semanas; segundos de manipulação são irrelevantes
        // slither-disable-next-line timestamp
        if (block.timestamp < fimDaEpoca(epoca)) revert EpocaNaoTerminou(epoca, fimDaEpoca(epoca));
        if (raiz == bytes32(0)) revert RaizInvalida();
        uint256 teto = tetoDaEpoca(epoca);
        if (total > teto) revert AcimaDoTetoDaEpoca(total, teto);
        if (totalPublicado + total > POOL_COMUNIDADE) {
            revert AcimaDoPool(total, POOL_COMUNIDADE - totalPublicado);
        }

        epocas[epoca] = Epoca({raiz: raiz, total: SafeCast.toUint128(total), resgatado: 0});
        totalPublicado += total;
        proximaEpoca = epoca + 1;
        emit EpocaPublicada(epoca, raiz, total);
    }

    // ------------------------------------------------------------------ resgate

    function resgatar(uint256 epoca, address conta, uint256 valor, bytes32[] calldata prova) public whenNotPaused {
        Epoca storage e = epocas[epoca];
        if (e.raiz == bytes32(0)) revert EpocaNaoPublicada(epoca);
        if (resgatado[epoca][conta]) revert JaResgatado(epoca, conta);
        if (valor > tetoPorCarteira) revert AcimaDoTetoPorCarteira(valor, tetoPorCarteira);
        // slither-disable-next-line calls-loop (contrato próprio e confiável, imutável)
        if (reputacao.balanceOf(conta) < 1) revert SemSeloDeReputacao(conta);

        bytes32 folha = keccak256(bytes.concat(keccak256(abi.encode(conta, valor))));
        if (!MerkleProof.verifyCalldata(prova, e.raiz, folha)) revert ProvaInvalida();

        uint256 novoResgatado = uint256(e.resgatado) + valor;
        // Defesa em profundidade: uma árvore malformada nunca emite além do total publicado
        if (novoResgatado > e.total) revert ParametrosInconsistentes();

        resgatado[epoca][conta] = true;
        e.resgatado = SafeCast.toUint128(novoResgatado);
        emit Resgate(epoca, conta, valor);
        // slither-disable-next-line calls-loop (contrato próprio e confiável, imutável)
        token.mint(conta, valor);
    }

    function resgatarVarias(
        uint256[] calldata epocas_,
        address conta,
        uint256[] calldata valores,
        bytes32[][] calldata provas
    ) external {
        if (epocas_.length != valores.length || epocas_.length != provas.length) {
            revert ParametrosInconsistentes();
        }
        for (uint256 i = 0; i < epocas_.length; i++) {
            resgatar(epocas_[i], conta, valores[i], provas[i]);
        }
    }

    // ------------------------------------------------------------------ administração

    function definirTetoPorCarteira(uint256 novo) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _definirTeto(novo);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _definirTeto(uint256 novo) private {
        // nunca acima do orçamento semanal do primeiro ano
        if (novo == 0 || novo > tetoDaEpoca(1)) revert TetoInvalido();
        emit TetoPorCarteiraAlterado(tetoPorCarteira, novo);
        tetoPorCarteira = novo;
    }
}

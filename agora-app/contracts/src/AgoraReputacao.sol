// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Checkpoints} from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IAgoraReputacao} from "./interfaces/IAgoraReputacao.sol";

/// @notice ERC-5192: Minimal Soulbound NFTs
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool);
}

/// @title AgoraReputacao — selo de reputação intransferível (soulbound)
/// @notice Um por membro verificado. Espelha o nível de reputação do app
///         (1 Aprendiz · 2 Colaborador · 3 Curador · 4 Guardião). O histórico de
///         níveis é guardado por bloco para que votações usem o nível do snapshot.
contract AgoraReputacao is ERC721, AccessControl, IERC5192, IAgoraReputacao {
    using Checkpoints for Checkpoints.Trace208;

    /// @notice Papel do backend da Ágora que emite, atualiza e revoga selos
    bytes32 public constant EMISSOR_ROLE = keccak256("EMISSOR_ROLE");
    uint8 public constant NIVEL_MAXIMO = 4;

    uint256 private _proximoId = 1;
    mapping(address membro => uint256) private _tokenDe;
    mapping(address membro => Checkpoints.Trace208) private _niveis;
    mapping(uint256 tokenId => uint8) private _nivelDoToken;

    error Intransferivel();
    error JaPossuiSelo(address membro);
    error SemSelo(address membro);
    error NivelInvalido(uint8 nivel);
    error ConsultaFutura(uint256 timepoint, uint48 agora);

    event NivelAtualizado(address indexed membro, uint256 indexed tokenId, uint8 nivelAnterior, uint8 nivel);

    constructor(address admin, address emissor) ERC721(unicode"Ágora · Reputação", "AGORA-REP") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EMISSOR_ROLE, emissor);
    }

    // ------------------------------------------------------------------ emissão

    function emitir(address membro, uint8 nivel) external onlyRole(EMISSOR_ROLE) returns (uint256 tokenId) {
        if (_tokenDe[membro] != 0) revert JaPossuiSelo(membro);
        _validarNivel(nivel);
        tokenId = _proximoId++;
        _tokenDe[membro] = tokenId;
        _mint(membro, tokenId);
        _gravarNivel(membro, tokenId, nivel);
        emit Locked(tokenId);
    }

    function atualizarNivel(address membro, uint8 nivel) external onlyRole(EMISSOR_ROLE) {
        uint256 tokenId = _tokenDe[membro];
        if (tokenId == 0) revert SemSelo(membro);
        _validarNivel(nivel);
        _gravarNivel(membro, tokenId, nivel);
    }

    /// @notice Revoga o selo (ex.: conta excluída ou fraude comprovada)
    function revogar(address membro) external onlyRole(EMISSOR_ROLE) {
        uint256 tokenId = _tokenDe[membro];
        if (tokenId == 0) revert SemSelo(membro);
        delete _tokenDe[membro];
        delete _nivelDoToken[tokenId];
        (uint208 anterior, uint208 atual) = _niveis[membro].push(clock(), 0);
        _burn(tokenId);
        // forge-lint: disable-next-line(unsafe-typecast) níveis são sempre 0..4
        emit NivelAtualizado(membro, tokenId, uint8(anterior), uint8(atual));
    }

    // ------------------------------------------------------------------ leitura

    function clock() public view returns (uint48) {
        return SafeCast.toUint48(block.number);
    }

    function tokenDe(address membro) external view returns (uint256) {
        return _tokenDe[membro];
    }

    function nivelDe(address membro) external view returns (uint8) {
        return uint8(_niveis[membro].latest());
    }

    /// @inheritdoc IAgoraReputacao
    function nivelEm(address membro, uint256 timepoint) external view returns (uint8) {
        uint48 agora = clock();
        if (timepoint >= agora) revert ConsultaFutura(timepoint, agora);
        return uint8(_niveis[membro].upperLookupRecent(SafeCast.toUint48(timepoint)));
    }

    function balanceOf(address membro) public view override(ERC721, IAgoraReputacao) returns (uint256) {
        return super.balanceOf(membro);
    }

    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint8 nivel = _nivelDoToken[tokenId];
        string memory nome = _nomeNivel(nivel);
        bytes memory json = abi.encodePacked(
            unicode'{"name":"Ágora · ',
            nome,
            unicode'","description":"Selo intransferível de reputação da comunidade Ágora. Conquistado por contribuição verificável.","attributes":[{"trait_type":"Nível","value":',
            Strings.toString(nivel),
            unicode'},{"trait_type":"Título","value":"',
            nome,
            '"}]}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(json));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }

    // ------------------------------------------------------------------ intransferível

    function approve(address, uint256) public pure override {
        revert Intransferivel();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Intransferivel();
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address from) {
        from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Intransferivel();
        return super._update(to, tokenId, auth);
    }

    // ------------------------------------------------------------------ internos

    function _gravarNivel(address membro, uint256 tokenId, uint8 nivel) private {
        _nivelDoToken[tokenId] = nivel;
        (uint208 anterior, uint208 atual) = _niveis[membro].push(clock(), nivel);
        // forge-lint: disable-next-line(unsafe-typecast) níveis são sempre 0..4
        emit NivelAtualizado(membro, tokenId, uint8(anterior), uint8(atual));
    }

    function _validarNivel(uint8 nivel) private pure {
        if (nivel == 0 || nivel > NIVEL_MAXIMO) revert NivelInvalido(nivel);
    }

    function _nomeNivel(uint8 nivel) private pure returns (string memory) {
        if (nivel == 4) return unicode"Guardião";
        if (nivel == 3) return "Curador";
        if (nivel == 2) return "Colaborador";
        return "Aprendiz";
    }
}

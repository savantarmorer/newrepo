// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Implantacao} from "./Implantacao.sol";

/// @notice Implanta a Ágora on-chain em TESTNET (Base Sepolia por padrão).
/// @dev forge script script/DeployTestnet.s.sol --rpc-url base_sepolia --broadcast --verify
///      Variáveis: PRIVATE_KEY, MULTISIG (Safe; se ausente usa o deployer), BACKEND_ADDRESS,
///      FUNDADORES (lista separada por vírgulas), INICIO_EPOCAS_ATRASADO (true = época 1
///      publicável na hora, útil para o seed).
contract DeployTestnet is Script, Implantacao {
    error RedePrincipalBloqueada(uint256 chainId);

    function run() external returns (Implantados memory d) {
        if (_ehMainnet(block.chainid)) revert RedePrincipalBloqueada(block.chainid);

        uint256 chave = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(chave);
        address multisig = vm.envOr("MULTISIG", deployer);
        address backend = vm.envAddress("BACKEND_ADDRESS");
        address[] memory padrao = new address[](1);
        padrao[0] = deployer;
        address[] memory fundadores = vm.envOr("FUNDADORES", ",", padrao);

        Config memory c = _configPadrao(multisig, backend, fundadores);
        if (vm.envOr("INICIO_EPOCAS_ATRASADO", false)) c.inicioEpocas = block.timestamp - 1 weeks;
        c.periodoVotacao = uint32(vm.envOr("PERIODO_VOTACAO_BLOCOS", uint256(c.periodoVotacao)));
        c.timelockAtraso = vm.envOr("TIMELOCK_ATRASO", c.timelockAtraso);

        vm.startBroadcast(chave);
        d = _implantar(c, deployer);
        vm.stopBroadcast();

        _salvar(d);
    }

    function _ehMainnet(uint256 id) internal pure returns (bool) {
        return id == 1 || id == 8453 || id == 137 || id == 10 || id == 42161;
    }

    function _salvar(Implantados memory d) internal {
        string memory k = "agora";
        vm.serializeUint(k, "chainId", block.chainid);
        vm.serializeUint(k, "bloco", block.number);
        vm.serializeAddress(k, "token", address(d.token));
        vm.serializeAddress(k, "reputacao_sbt", address(d.reputacao));
        vm.serializeAddress(k, "governor", address(d.governor));
        vm.serializeAddress(k, "timelock", address(d.timelock));
        vm.serializeAddress(k, "distribuidor", address(d.distribuidor));
        string memory json = vm.serializeAddress(k, "fundo_mutirao", address(d.fundo));
        string memory caminho = string.concat("deployments/", vm.toString(block.chainid), ".json");
        vm.writeJson(json, caminho);
        console2.log("Enderecos salvos em", caminho);
        console2.log("Token DRC     ", address(d.token));
        console2.log("SBT reputacao ", address(d.reputacao));
        console2.log("Governor      ", address(d.governor));
        console2.log("Timelock      ", address(d.timelock));
        console2.log("Distribuidor  ", address(d.distribuidor));
        console2.log("Fundo Mutirao ", address(d.fundo));
    }
}

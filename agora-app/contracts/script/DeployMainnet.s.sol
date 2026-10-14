// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Implantacao} from "./Implantacao.sol";

/// @notice Implantação em REDE PRINCIPAL (Base ou Polygon PoS). Script separado e travado.
/// @dev Só roda com TODAS as condições abaixo (ver contracts/SECURITY.md):
///  - CONFIRMO_DEPLOY_MAINNET="SIM, CHECKLIST DO SECURITY.md CONCLUIDO"
///  - AUDITORIA_URL apontando para o relatório da auditoria externa
///  - PARECER_JURIDICO_URL apontando para o parecer jurídico
///  - TESTNET_SEMANAS >= 4 (semanas de teste com usuários reais)
///  - MULTISIG é um contrato (Safe) já implantado nesta rede
///  - BACKEND_ADDRESS diferente da MULTISIG e dos fundadores
contract DeployMainnet is Script, Implantacao {
    string internal constant FRASE = "SIM, CHECKLIST DO SECURITY.md CONCLUIDO";

    error RedeNaoSuportada(uint256 chainId);
    error ConfirmacaoAusente();
    error ChecklistIncompleto(string item);
    error MultisigNaoEhContrato(address multisig);
    error BackendInvalido();

    function run() external returns (Implantados memory d) {
        if (block.chainid != 8453 && block.chainid != 137) revert RedeNaoSuportada(block.chainid);
        if (keccak256(bytes(vm.envOr("CONFIRMO_DEPLOY_MAINNET", string("")))) != keccak256(bytes(FRASE))) {
            revert ConfirmacaoAusente();
        }
        if (bytes(vm.envOr("AUDITORIA_URL", string(""))).length == 0) revert ChecklistIncompleto("auditoria externa");
        if (bytes(vm.envOr("PARECER_JURIDICO_URL", string(""))).length == 0) revert ChecklistIncompleto("revisao juridica");
        if (vm.envOr("TESTNET_SEMANAS", uint256(0)) < 4) revert ChecklistIncompleto("4 semanas de testnet");

        uint256 chave = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(chave);
        address multisig = vm.envAddress("MULTISIG");
        if (multisig.code.length == 0) revert MultisigNaoEhContrato(multisig);
        address backend = vm.envAddress("BACKEND_ADDRESS");
        address[] memory fundadores = vm.envAddress("FUNDADORES", ",");
        if (backend == multisig || backend == address(0)) revert BackendInvalido();
        for (uint256 i = 0; i < fundadores.length; i++) {
            if (fundadores[i] == backend) revert BackendInvalido();
        }

        Config memory c = _configPadrao(multisig, backend, fundadores);
        // Base e Polygon PoS têm blocos de ~2s: 302.400 blocos ≈ 7 dias de votação

        vm.startBroadcast(chave);
        d = _implantar(c, deployer);
        vm.stopBroadcast();

        console2.log("Mainnet implantada. Verifique TODOS os contratos no explorador antes de anunciar.");
        console2.log("Token DRC     ", address(d.token));
        console2.log("SBT reputacao ", address(d.reputacao));
        console2.log("Governor      ", address(d.governor));
        console2.log("Timelock      ", address(d.timelock));
        console2.log("Distribuidor  ", address(d.distribuidor));
        console2.log("Fundo Mutirao ", address(d.fundo));
    }
}

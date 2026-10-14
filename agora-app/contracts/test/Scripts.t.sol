// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DeployTestnet} from "../script/DeployTestnet.s.sol";
import {DeployMainnet} from "../script/DeployMainnet.s.sol";
import {Implantacao} from "../script/Implantacao.sol";

contract ScriptsTest is Test {
    function test_deployTestnetCompleto() public {
        vm.chainId(84532);
        (address deployer, uint256 chave) = makeAddrAndKey("deployer");
        vm.setEnv("PRIVATE_KEY", vm.toString(chave));
        vm.setEnv("BACKEND_ADDRESS", vm.toString(makeAddr("backend")));
        vm.setEnv("INICIO_EPOCAS_ATRASADO", "true");
        vm.warp(1_760_000_000);
        DeployTestnet s = new DeployTestnet();
        Implantacao.Implantados memory d = s.run();
        assertEq(d.token.totalSupply(), 45_000_000e18);
        assertTrue(d.timelock.hasRole(d.timelock.PROPOSER_ROLE(), address(d.governor)));
        assertFalse(d.timelock.hasRole(d.timelock.DEFAULT_ADMIN_ROLE(), deployer), "deployer renunciou");
        assertTrue(d.token.hasRole(d.token.MINTER_ROLE(), address(d.distribuidor)));
        assertEq(d.distribuidor.inicio(), block.timestamp - 1 weeks);
        assertTrue(vm.exists("deployments/84532.json"));
        vm.removeFile("deployments/84532.json");
    }

    function test_testnetRecusaMainnet() public {
        vm.chainId(8453);
        DeployTestnet s = new DeployTestnet();
        vm.expectRevert(abi.encodeWithSelector(DeployTestnet.RedePrincipalBloqueada.selector, 8453));
        s.run();
    }

    function test_mainnetExigeChecklist() public {
        DeployMainnet s = new DeployMainnet();
        vm.chainId(84532);
        vm.expectRevert(abi.encodeWithSelector(DeployMainnet.RedeNaoSuportada.selector, 84532));
        s.run();

        vm.chainId(8453);
        vm.expectRevert(DeployMainnet.ConfirmacaoAusente.selector);
        s.run();

        vm.setEnv("CONFIRMO_DEPLOY_MAINNET", "SIM, CHECKLIST DO SECURITY.md CONCLUIDO");
        vm.expectRevert(abi.encodeWithSelector(DeployMainnet.ChecklistIncompleto.selector, "auditoria externa"));
        s.run();

        vm.setEnv("AUDITORIA_URL", "https://exemplo/auditoria.pdf");
        vm.expectRevert(abi.encodeWithSelector(DeployMainnet.ChecklistIncompleto.selector, "revisao juridica"));
        s.run();

        vm.setEnv("PARECER_JURIDICO_URL", "https://exemplo/parecer.pdf");
        vm.expectRevert(abi.encodeWithSelector(DeployMainnet.ChecklistIncompleto.selector, "4 semanas de testnet"));
        s.run();

        vm.setEnv("TESTNET_SEMANAS", "6");
        (, uint256 chave) = makeAddrAndKey("deployer");
        vm.setEnv("PRIVATE_KEY", vm.toString(chave));
        address naoContrato = makeAddr("safeFalsa");
        vm.setEnv("MULTISIG", vm.toString(naoContrato));
        vm.expectRevert(abi.encodeWithSelector(DeployMainnet.MultisigNaoEhContrato.selector, naoContrato));
        s.run();
    }
}

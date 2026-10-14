// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

/// @notice Gera as chamadas que a Safe deve assinar para entregar papéis administrativos
///         ao Timelock (governança). Executar por etapas — ver TOKENOMICS.md, "Descentralização".
/// @dev Não envia transações: imprime alvo + calldata para colar no Transaction Builder da Safe.
///      ETAPA=1 → DEFAULT_ADMIN do SBT e do Distribuidor passam ao Timelock (multisig mantém pausa)
///      ETAPA=2 → DEFAULT_ADMIN do token passa ao Timelock e a Safe renuncia
///      ETAPA=3 → Safe renuncia às pausas (só depois de 12 meses estáveis)
contract TransferirParaGovernanca is Script {
    bytes32 internal constant ADMIN = 0x00;
    bytes32 internal constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    function run() external view {
        uint256 etapa = vm.envUint("ETAPA");
        address safe = vm.envAddress("MULTISIG");
        address timelock = vm.envAddress("TIMELOCK");
        address token = vm.envAddress("TOKEN");
        address sbt = vm.envAddress("REPUTACAO_SBT");
        address distribuidor = vm.envAddress("DISTRIBUIDOR");

        if (etapa == 1) {
            _imprimir(sbt, abi.encodeCall(IAccessControl.grantRole, (ADMIN, timelock)));
            _imprimir(distribuidor, abi.encodeCall(IAccessControl.grantRole, (ADMIN, timelock)));
            _imprimir(sbt, abi.encodeCall(IAccessControl.renounceRole, (ADMIN, safe)));
            _imprimir(distribuidor, abi.encodeCall(IAccessControl.renounceRole, (ADMIN, safe)));
        } else if (etapa == 2) {
            _imprimir(token, abi.encodeCall(IAccessControl.grantRole, (ADMIN, timelock)));
            _imprimir(token, abi.encodeCall(IAccessControl.renounceRole, (ADMIN, safe)));
        } else if (etapa == 3) {
            _imprimir(token, abi.encodeCall(IAccessControl.renounceRole, (PAUSER_ROLE, safe)));
            _imprimir(distribuidor, abi.encodeCall(IAccessControl.renounceRole, (PAUSER_ROLE, safe)));
        } else {
            revert("ETAPA deve ser 1, 2 ou 3");
        }
    }

    function _imprimir(address alvo, bytes memory dados) internal pure {
        console2.log("alvo:", alvo);
        console2.logBytes(dados);
    }
}

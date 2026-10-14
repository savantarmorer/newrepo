// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

interface ISafeProxyFactory {
    function createProxyWithNonce(address singleton, bytes memory initializer, uint256 saltNonce)
        external
        returns (address proxy);
}

interface ISafe {
    function setup(
        address[] calldata owners,
        uint256 threshold,
        address to,
        bytes calldata data,
        address fallbackHandler,
        address paymentToken,
        uint256 payment,
        address payable paymentReceiver
    ) external;

    function getOwners() external view returns (address[] memory);
    function getThreshold() external view returns (uint256);
}

/// @notice Cria a multisig Safe 3-de-5 dos sócios (Safe v1.4.1, endereços canônicos).
/// @dev forge script script/ConfigurarSafe.s.sol --rpc-url base_sepolia --broadcast
///      SAFE_OWNERS=0x..,0x..,0x..,0x..,0x..  SAFE_THRESHOLD=3  PRIVATE_KEY=...
///      Em produção prefira criar a Safe pela interface oficial (app.safe.global) e
///      conferir os mesmos parâmetros; este script existe para testnet e auditoria.
contract ConfigurarSafe is Script {
    // Safe v1.4.1 — mesmos endereços em Base, Base Sepolia, Polygon e Amoy
    address internal constant FACTORY = 0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67;
    address internal constant SAFE_L2_SINGLETON = 0x29fcB43b46531BcA003ddC8FCB67FFE91900C762;
    address internal constant FALLBACK_HANDLER = 0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99;

    error ConfiguracaoInvalida(uint256 donos, uint256 limiar);

    function run() external returns (address safe) {
        address[] memory donos = vm.envAddress("SAFE_OWNERS", ",");
        uint256 limiar = vm.envOr("SAFE_THRESHOLD", uint256(3));
        if (donos.length != 5 || limiar != 3) revert ConfiguracaoInvalida(donos.length, limiar);

        bytes memory init = abi.encodeCall(
            ISafe.setup, (donos, limiar, address(0), "", FALLBACK_HANDLER, address(0), 0, payable(address(0)))
        );
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        safe =
            ISafeProxyFactory(FACTORY).createProxyWithNonce(SAFE_L2_SINGLETON, init, vm.envOr("SAFE_SALT", uint256(0)));
        vm.stopBroadcast();

        require(ISafe(safe).getThreshold() == 3, "limiar incorreto");
        require(ISafe(safe).getOwners().length == 5, "donos incorretos");
        console2.log("Safe 3-de-5 criada em", safe);
        console2.log("Defina MULTISIG=%s antes do deploy dos contratos.", safe);
    }
}

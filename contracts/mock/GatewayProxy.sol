// SPDX-License-Identifier: MIT
pragma solidity ^0.5.2;

/**
 * @dev return VWBL Gateway address.
 */
contract GatewayProxy {
    address gatewayAddress;

    constructor(address _gatewayAddress) public {
        gatewayAddress = _gatewayAddress;
    }

    function getGatewayAddress() public view returns (address){
        return gatewayAddress;
    }
}
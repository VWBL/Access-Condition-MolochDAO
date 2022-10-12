// SPDX-License-Identifier: MIT
pragma solidity ^0.5.2;

interface IGatewayProxy {
    function getGatewayAddress() external view returns (address);
}
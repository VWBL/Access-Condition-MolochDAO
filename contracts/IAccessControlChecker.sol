// SPDX-License-Identifier: MIT
pragma solidity ^0.5.2;

interface IAccessControlChecker {
    function checkAccessControl(address user, bytes32 documentId) external view returns (bool);

    function getOwnerAddress(
        bytes32 documentId
    ) external view returns (address);
}
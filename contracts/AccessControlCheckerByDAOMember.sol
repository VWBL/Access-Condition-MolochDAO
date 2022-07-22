// SPDX-License-Identifier: MIT
pragma solidity ^0.5.2;

import "./IAccessControlChecker.sol";
import "./dependencies/Moloch.sol";

contract AccessControlCheckerByDAOMember is IAccessControlChecker {
    Moloch public molochContract;

    constructor(address _moloch) public {
        molochContract = Moloch(_moloch);
    }

    function checkAccessControl(
        address user,
        bytes32 documentId
    ) external view returns (bool) {
        (,uint256 shares, uint256 loot,,,) = molochContract.members(user);
    
        if (shares > 0 || loot > 0) {
            return true;
        }

        return false;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.5.2;

import "../IAccessControlChecker.sol";
import "../IVWBLGateway.sol";

/**
 * @dev VWBL Gateway Contract which manage who has access right of digital content.
 */
contract VWBLGateway is IVWBLGateway {
    mapping (bytes32 => address) public documentIdToConditionContract;
    mapping (bytes32 => address) public documentIdToMinter;
    mapping (bytes32 => mapping (address => bool)) public paidUsers;
    bytes32[] public documentIds;

    uint256 public feeWei = 1000000000000000000; // 1MATIC
    uint256 public pendingFee;

    event accessControlAdded(bytes32 documentId, address conditionContract);
    event feeWeiChanged(uint256 oldPercentage, uint256 newPercentage);
    event feePaid(bytes32 documentId, address sender, address to);

    constructor(uint256 _feeWei) public {
        feeWei = _feeWei;
    }

    /**
     * @notice Get array of documentIds
     */
    function getDocumentIds() public view returns (bytes32[] memory) {
        return documentIds;
    }

    /**
     * @notice Returns True if user has access rights of digital content or digital content creator
     *         This function is called by VWBL Network (Decryption key management network)
     * @param user The address of decryption key requester or decryption key sender to VWBL Network
     * @param documentId The Identifier of digital content and decryption key
     */
    function hasAccessControl(address user, bytes32 documentId) public view returns (bool) {
        address accessConditionContractAddress = documentIdToConditionContract[documentId];
        if (accessConditionContractAddress == address(0)) {
            return false;
        }
        IAccessControlChecker checker = IAccessControlChecker(accessConditionContractAddress);
        bool isPaidUser = paidUsers[documentId][user] || feeWei == 0;
        bool isOwner = checker.getOwnerAddress(documentId) == user;
        bool isMinter = documentIdToMinter[documentId] == user;
        bool hasAccess = checker.checkAccessControl(user, documentId);
        return  isOwner || isMinter || (isPaidUser && hasAccess);
    }

    /**
     * @notice Grant access control feature and registering access condition of digital content
     * @param documentId The Identifier of digital content and decryption key
     * @param conditionContractAddress The contract address of access condition
     * @param minter The address of content creator
     */
    function grantAccessControl(
        bytes32 documentId,
        address conditionContractAddress,
        address minter
    ) public payable {
        require(msg.value <= feeWei, "Fee is too high");
        require(msg.value >= feeWei, "Fee is insufficient");
        require(
            documentIdToConditionContract[documentId] == address(0),
            "documentId is already used"
        );

        pendingFee += msg.value;
        documentIdToConditionContract[documentId] = conditionContractAddress;
        documentIds.push(documentId);
        documentIdToMinter[documentId] = minter;
        emit accessControlAdded(documentId, conditionContractAddress);
    }

    /**
     * @notice Pay fee to grant access
     * @param documentId The Identifier of digital content and decryption key
     * @param user address to grant
     */
    function payFee(
        bytes32 documentId,
        address user
    ) public payable {
        require(msg.value <= feeWei, "Fee is too high");
        require(msg.value >= feeWei, "Fee is insufficient");
        require(
            documentIdToConditionContract[documentId] != address(0),
            "document id is not registered"
        );

        pendingFee += msg.value;
        paidUsers[documentId][user] = true;
        emit feePaid(documentId, msg.sender, user);
    }
}
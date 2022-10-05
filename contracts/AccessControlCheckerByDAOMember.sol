// SPDX-License-Identifier: MIT
pragma solidity ^0.5.2;

import "./IAccessControlChecker.sol";
import "./dependencies/Moloch.sol";
import "./IVWBLGateway.sol";

contract AccessControlCheckerByDAOMember is IAccessControlChecker {
    Moloch public molochContract;
    address public vwblGateway;

    struct Info {
        address author;
        string name;
        string encryptedDataUrl;
    }

    mapping(bytes32 => Info) public documentIdToInfo;
    mapping(bytes32 => bool) public existDocumentId; 
    bytes32[] public documentIds;

    event grantedAccessControl(bytes32 documentId);

    modifier onlyDAOMember {
        (,uint256 shares, uint256 loot,,,) = molochContract.members(msg.sender);
        require(shares > 0 || loot > 0, "msg.sender is not a DAO member");
        _;
    }

    constructor(address _moloch, address _vwblGateway) public {
        molochContract = Moloch(_moloch);
        vwblGateway = _vwblGateway;
    }

    /**
     * @notice Get array of documentIds
     */
    function getDocumentIds() external view returns (bytes32[] memory) {
        return documentIds;
    }

    /**
     * @dev Return owner address of document id
     * @param documentId The Identifier of digital content and decryption key
     * @return owner address
     */
    function getOwnerAddress(bytes32 documentId) external view returns (address) {
        return address(0);
    }

    /**
     * @notice Return owner address of documentId
     * @param documentId The Identifier of digital content and decryption key 
     */
    function getMinterAddress(bytes32 documentId) external view returns (address) {
        return documentIdToInfo[documentId].author;
    } 

    /**
     * @notice Return true if user is DAO member. 
     *         This function is called by VWBL Gateway contract.
     * @param user The address of decryption key requester
     * @param documentId The Identifier of digital content and decryption key
     */
    function checkAccessControl(
        address user,
        bytes32 documentId
    ) external view returns (bool) {
        (,uint256 shares, uint256 loot,,,) = molochContract.members(user);
    
        if (
            existDocumentId[documentId]
            && (shares > 0 || loot > 0)
        ) {
            return true;
        }

        return false;
    }

    /**
     * @notice Grant access control, register access condition and digital content info
     * @param documentId The Identifier of digital content and decryption key
     * @param name The digital content name
     * @param encryptedDataUrl The Url of encrypted digital content data
     */
    function grantAccessControlToDAOMember(
        bytes32 documentId,
        string calldata name,
        string calldata encryptedDataUrl
    ) external onlyDAOMember payable returns (bytes32) {
        IVWBLGateway(vwblGateway).grantAccessControl.value(msg.value)(documentId, address(this));

        documentIdToInfo[documentId].author = msg.sender;
        documentIdToInfo[documentId].name = name;
        documentIdToInfo[documentId].encryptedDataUrl = encryptedDataUrl;
        existDocumentId[documentId] = true;
        documentIds.push(documentId);

        emit grantedAccessControl(documentId);
        return documentId;
    }
}
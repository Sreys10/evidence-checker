// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EvidenceRegistry {
    struct Evidence {
        string ipfsHash;
        string fileName;
        string fileType;
        uint256 timestamp;
        address uploader;
        string originalEvidenceId; // Link to off-chain DB ID
    }

    // Mapping from Evidence ID (off-chain) to Blockchain Record? 
    // Or just an array of evidences per user?
    // We'll map IPFS hash to Evidence to enforce uniqueness, or just array.
    
    mapping(string => Evidence) public evidenceByHash;
    mapping(string => bool) public isEvidenceRegistered;
    
    event EvidenceRegistered(
        address indexed uploader,
        string ipfsHash,
        string fileName,
        uint256 timestamp
    );

    function registerEvidence(
        string memory _ipfsHash,
        string memory _fileName,
        string memory _fileType,
        string memory _evidenceId
    ) public {
        require(!isEvidenceRegistered[_ipfsHash], "Evidence already registered");

        Evidence memory newEvidence = Evidence({
            ipfsHash: _ipfsHash,
            fileName: _fileName,
            fileType: _fileType,
            timestamp: block.timestamp,
            uploader: msg.sender,
            originalEvidenceId: _evidenceId
        });

        evidenceByHash[_ipfsHash] = newEvidence;
        isEvidenceRegistered[_ipfsHash] = true;

        emit EvidenceRegistered(msg.sender, _ipfsHash, _fileName, block.timestamp);
    }

    function getEvidence(string memory _ipfsHash) public view returns (Evidence memory) {
        require(isEvidenceRegistered[_ipfsHash], "Evidence not found");
        return evidenceByHash[_ipfsHash];
    }
}

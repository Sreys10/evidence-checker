// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ImageStorage {
    struct EvidenceRecord {
        string ipfsHash;
        string analystId;
        uint256 confidenceScore;
        string status;
        uint256 timestamp;
    }

    event EvidenceStored(
        address indexed user, 
        string ipfsHash, 
        string analystId, 
        uint256 confidenceScore, 
        string status, 
        uint256 timestamp
    );

    mapping(address => EvidenceRecord[]) private _recordsByUser;

    function storeEvidence(
        string memory _ipfsHash,
        string memory _analystId,
        uint256 _confidenceScore,
        string memory _status
    ) public {
        EvidenceRecord memory newRecord = EvidenceRecord({
            ipfsHash: _ipfsHash,
            analystId: _analystId,
            confidenceScore: _confidenceScore,
            status: _status,
            timestamp: block.timestamp
        });
        _recordsByUser[msg.sender].push(newRecord);
        emit EvidenceStored(
            msg.sender, 
            _ipfsHash, 
            _analystId, 
            _confidenceScore, 
            _status, 
            block.timestamp
        );
    }

    function getEvidence(address user) external view returns (EvidenceRecord[] memory) {
        return _recordsByUser[user];
    }

    // Legacy support
    function storeHash(string memory _hash) public {
        storeEvidence(_hash, "legacy", 0, "unknown");
    }
    
    function getHashes(address user) external view returns (string[] memory) {
        uint256 count = _recordsByUser[user].length;
        string[] memory hashes = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            hashes[i] = _recordsByUser[user][i].ipfsHash;
        }
        return hashes;
    }
}

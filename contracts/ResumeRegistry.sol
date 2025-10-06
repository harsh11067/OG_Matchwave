// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ResumeRegistry is Ownable {
    using ECDSA for bytes32;

    // signer that represents your 0G Compute pipeline (can rotate)
    address public computeSigner;

    struct ResumeMeta {
        bytes32 resumeHash;     // keccak256 of the uploaded resume file
        string  storageURI;     // 0G Storage URI (e.g., zgs://... or https link to indexer)
        uint64  updatedAt;
    }

    struct Analysis {
        bytes32 resumeHash;     // must match user's current resumeHash
        string  reportURI;      // 0G Storage URI for full JSON analysis
        string  model;          // model or pipeline version, e.g., "resume-v0.3"
        uint16  overallScore;   // 0..100
        uint64  timestamp;      // set by chain at submission time
    }

    // candidate => latest resume meta
    mapping(address => ResumeMeta) public resumes;

    // candidate => latest analysis
    mapping(address => Analysis) public analyses;

    event ResumeUploaded(address indexed candidate, bytes32 resumeHash, string storageURI);
    event AnalysisSubmitted(address indexed candidate, uint16 score, string model, string reportURI, bytes32 resumeHash);

    constructor(address _computeSigner) Ownable(msg.sender) {
        computeSigner = _computeSigner;
    }

    function setComputeSigner(address _signer) external onlyOwner {
        computeSigner = _signer;
    }

    // candidate anchors their resume hash + storage pointer
    function uploadResume(bytes32 resumeHash, string calldata storageURI) external {
        resumes[msg.sender] = ResumeMeta({
            resumeHash: resumeHash,
            storageURI: storageURI,
            updatedAt: uint64(block.timestamp)
        });
        emit ResumeUploaded(msg.sender, resumeHash, storageURI);
    }

    // compute pipeline posts signed analysis
    // signature covers (candidate, resumeHash, score, model, reportURI, chainId)
    function submitAnalysis(
        address candidate,
        bytes32 resumeHash,
        uint16 score,
        string calldata model,
        string calldata reportURI,
        bytes calldata signature
    ) external {
        require(resumes[candidate].resumeHash == resumeHash, "resume hash mismatch");

        bytes32 digest = keccak256(abi.encodePacked(
            candidate, resumeHash, score, model, reportURI, block.chainid
        ));
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));

        address signer = messageHash.recover(signature);
        require(signer == computeSigner, "invalid compute signature");

        analyses[candidate] = Analysis({
            resumeHash: resumeHash,
            reportURI: reportURI,
            model: model,
            overallScore: score,
            timestamp: uint64(block.timestamp)
        });

        emit AnalysisSubmitted(candidate, score, model, reportURI, resumeHash);
    }
}

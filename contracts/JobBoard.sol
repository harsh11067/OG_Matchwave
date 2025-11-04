// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";



contract JobBoard is Ownable {
    using ECDSA for bytes32;

    address public computeSigner;

    struct Job {
        address owner;
        string  jobURI;     // 0G Storage JSON describing weights/requirements
        uint64  createdAt;
        bool    active;
    }

    struct Match {
        uint16 score;       // 0..100
        string reportURI;   // 0G Storage report for this candidate→job
        uint64 timestamp;
    }

    uint256 public nextJobId = 1;
    mapping(uint256 => Job) public jobs;
    // jobId => candidate => match
    mapping(uint256 => mapping(address => Match)) public matches;

    event JobPosted(uint256 indexed jobId, address indexed owner, string jobURI);
    event JobStatus(uint256 indexed jobId, bool active);
    event MatchSubmitted(uint256 indexed jobId, address indexed candidate, uint16 score, string reportURI);

    constructor(address _computeSigner) Ownable(msg.sender) {
        computeSigner = _computeSigner;
    }
    
    function setComputeSigner(address _signer) external onlyOwner { 
        computeSigner = _signer; 
    }

    function postJob(string calldata jobURI) external returns (uint256 id) {
        id = nextJobId++;
        jobs[id] = Job({ 
            owner: msg.sender, 
            jobURI: jobURI, 
            createdAt: uint64(block.timestamp), 
            active: true 
        });
        emit JobPosted(id, msg.sender, jobURI);
    }

    function setJobActive(uint256 jobId, bool active) external {
        require(msg.sender == jobs[jobId].owner, "not owner");
        jobs[jobId].active = active;
        emit JobStatus(jobId, active);
    }

    // signature covers (jobId, candidate, score, reportURI, chainId)
    function submitMatch(
        uint256 jobId,
        address candidate,
        uint16 score,
        string calldata reportURI,
        bytes calldata signature
    ) external {
        require(jobs[jobId].active, "inactive job");

        bytes32 digest = keccak256(abi.encodePacked(
            jobId, candidate, score, reportURI, block.chainid
        ));
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));

        address signer = messageHash.recover(signature);
        require(signer == computeSigner, "invalid compute signature");

        matches[jobId][candidate] = Match({
            score: score,
            reportURI: reportURI,
            timestamp: uint64(block.timestamp)
        });
        emit MatchSubmitted(jobId, candidate, score, reportURI);
    }

    event HireConfirmed(uint256 indexed jobId, address indexed candidate, address recruiter, string outcomeURI);

    function confirmHire(uint256 jobId, address candidate, string calldata outcomeURI) external {
        require(msg.sender == jobs[jobId].owner, "not job owner");
        emit HireConfirmed(jobId, candidate, msg.sender, outcomeURI);
    }
}

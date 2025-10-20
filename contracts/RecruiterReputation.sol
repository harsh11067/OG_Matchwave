// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RecruiterReputation {
    struct Feedback {
        address candidate;
        uint8 score; // 0–100
        string noteURI; // Optional: URI to 0G Storage feedback note
        uint64 timestamp;
    }

    mapping(address => Feedback[]) public feedbacks;

    event FeedbackSubmitted(address indexed recruiter, address indexed candidate, uint8 score, string noteURI);

    function submitFeedback(address recruiter, uint8 score, string calldata noteURI) external {
        require(score <= 100, "Invalid score");
        feedbacks[recruiter].push(Feedback({
            candidate: msg.sender,
            score: score,
            noteURI: noteURI,
            timestamp: uint64(block.timestamp)
        }));
        emit FeedbackSubmitted(recruiter, msg.sender, score, noteURI);
    }

    function getReputation(address recruiter) external view returns (uint256 avg, uint256 count) {
        Feedback[] storage arr = feedbacks[recruiter];
        uint256 sum;
        for (uint i = 0; i < arr.length; i++) sum += arr[i].score;
        if (arr.length == 0) return (0, 0);
        return (sum / arr.length, arr.length);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RecruiterReputation {
    struct Rating {
        uint8 score;
        string comment;
    }
    mapping(address => Rating[]) public ratings;

    event Rated(address indexed recruiter, uint8 score, string comment);

    function rateRecruiter(address recruiter, uint8 score, string calldata comment) external {
        require(score <= 5, "Score must be 0-5");
        ratings[recruiter].push(Rating(score, comment));
        emit Rated(recruiter, score, comment);
    }

    function getAverage(address recruiter) public view returns (uint256) {
        Rating[] memory r = ratings[recruiter];
        uint sum;
        for (uint i; i < r.length; i++) sum += r[i].score;
        return r.length == 0 ? 0 : sum / r.length;
    }
}

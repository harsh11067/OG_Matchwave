// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SkillCredential is ERC721URIStorage, Ownable {
    uint256 public tokenCount;

    // 👇 Pass msg.sender to Ownable’s constructor
    constructor() ERC721("SkillCredential", "SKC") Ownable(msg.sender) {
        // You can initialize stuff here if needed
    }

    function issueCredential(address to, string memory uri) public onlyOwner {
        tokenCount++;
        _safeMint(to, tokenCount);
        _setTokenURI(tokenCount, uri);
    }
}

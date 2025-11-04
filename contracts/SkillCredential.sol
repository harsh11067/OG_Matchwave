// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract SkillCredential is ERC721URIStorage {
    uint256 private _nextTokenId = 1;

    constructor() ERC721("SkillCredential", "SKILL") {}

    function issueCredential(address to, string memory uri) public {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function tokenCount() public view returns (uint256) {
        return _nextTokenId - 1;
    }
}

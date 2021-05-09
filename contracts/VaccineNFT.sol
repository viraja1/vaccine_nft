// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract VaccineNFT is ERC1155 {
    uint256 public constant COVID = 0;

    constructor() public ERC1155("https://gateway.pinata.cloud/ipfs/QmZLS7H7cZzKymzqc5sYJD1mCAMKKf9upMutazWPyFntLh/nft/{id}.json") {
        _mint(msg.sender, COVID, 10**9 * 8, "");
    }
}


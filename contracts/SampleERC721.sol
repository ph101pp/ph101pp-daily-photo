// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * @title SampleERC721
 * @dev Create a sample ERC721 standard token
 */
contract SampleERC721 is ERC1155  {

    constructor(string memory url) ERC1155(url) {}
}
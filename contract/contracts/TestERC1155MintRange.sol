// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155MintRange.sol";
import "hardhat/console.sol";

contract TestERC1155MintRange is ERC1155MintRange {
    constructor(
        address[] memory initialHolders
    ) ERC1155_("") ERC1155MintRange(initialHolders) {}

    function initialBalanceOf(
        address account,
        uint256 tokenId
    ) internal view override returns (uint256) {
        if (_includesAddress(initialHolders(tokenId), account)) {
            // tokenId 0 -> everyone gets 99
            if (tokenId == 0) {
                return 9999;
            }
            // other tokens -> dynamic by token id
            else {
                return (tokenId % 10);
            }
        }
        return 0;
    }

    function setInitialHolders(address[] memory addresses) public {
        _setInitialHolders(addresses);
    }

    function mintRange(
        MintRangeInput memory input,
        bytes32 checksum
    ) public virtual {
        _mintRange(input, checksum);
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual {
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual {
        _mintBatch(to, ids, amounts, data);
    }

    function burn(address from, uint256 id, uint256 amount) public virtual {
        _burn(from, id, amount);
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public virtual {
        _burnBatch(from, ids, amounts);
    }
}

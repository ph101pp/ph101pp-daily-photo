// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155MintRangeUpdateable.sol";

contract TestERC1155MintRangeUpdateable is ERC1155MintRangeUpdateable {
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
                return (tokenId % 10) + 1;
            }
        }
        return 0;
    }

    function setInitialHolders(address[] memory addresses) public {
        _setInitialHolders(addresses);
    }

    /**
     * @dev Lock initial holders up to tokenid
     */
    function setLockInitialHoldersUpTo(uint256 tokenId) public {
        _setLockInitialHoldersUpTo(tokenId);
    }

    function updateInitialHoldersRange(
        UpdateInitialHolderRangesInput memory input
    ) public virtual {
        _updateInitialHoldersRange(input);
    }

    function updateInitialHoldersRangeSafe(
        UpdateInitialHolderRangesInput memory input,
        bytes32 checksum
    ) public virtual {
        _updateInitialHoldersRangeSafe(input, checksum);
    }

    function mintRange(
        MintRangeInput memory input
    ) public virtual {
        _mintRange(input);
    }

    function mintRangeSafe(
        MintRangeInput memory input,
        bytes32 checksum
    ) public virtual {
        _mintRangeSafe(input, checksum);
    }

    function pause() public {
        _pause();
    }

    function unpause() public {
        _unpause();
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

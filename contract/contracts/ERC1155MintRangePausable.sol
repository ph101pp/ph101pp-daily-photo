// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC1155/extensions/ERC1155Supply.sol)

pragma solidity ^0.8.0;

import "./ERC1155MintRange.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @dev Extension of ERC1155MintRange enables ability update initial holders.
 */
abstract contract ERC1155MintRangePausable is ERC1155MintRange, Pausable {
    
    function _setInitialHolders(address[] memory addresses)
        internal
        virtual
        override
        whenNotPaused
    {
        super._setInitialHolders(addresses);
    }

    /**
     * @dev Lazy-mint a range of new tokenIds to initial holders
     */
    function _mintRange(
        uint[] memory ids,
        uint[][] memory amounts,
        bytes32 inputChecksum
    ) internal virtual override whenNotPaused {
        super._mintRange(ids, amounts, inputChecksum);
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint[] memory ids,
        uint[] memory amounts,
        bytes memory data
    ) internal virtual override whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC1155/extensions/ERC1155Supply.sol)

pragma solidity ^0.8.0;

import "./ERC1155MintRange.sol";
import "./ERC1155MintRangePausable.sol";

/**
 * @dev Extension of ERC1155MintRange enables ability update initial holders.
 */
abstract contract ERC1155MintRangeUpdateable is ERC1155MintRangePausable {
    // used to check validity of updateInitialHolderRangeInput
    uint private _pauseTimestamp;

    uint256 public lastRangeTokenIdWithLockedInitialHolders;
    bool public isZeroLocked;

    function _pause() internal virtual override {
        _pauseTimestamp = block.timestamp;
        super._pause();
    }

    /**
     * @dev Lock initial holders up to tokenid
     */
    function _setLockInitialHoldersUpTo(
        uint256 tokenId
    ) internal virtual whenNotPaused {
        require(
            tokenId > lastRangeTokenIdWithLockedInitialHolders,
            "Already locked."
        );
        require(
            isZeroMinted && tokenId <= lastRangeTokenIdMinted,
            "Unminted tokens."
        );
        lastRangeTokenIdWithLockedInitialHolders = tokenId;
        if (!isZeroLocked) {
            isZeroLocked = true;
        }
    }

    /**
     * @dev Return current initial holders
     */
    function initialHoldersRange()
        public
        view
        virtual
        returns (address[][] memory, uint[] memory)
    {
        return (_initialHolders, _initialHoldersRange);
    }

    /**
     * @dev Implement: May be overwritten to add custom values to checksum test.
     */
    function _customUpdateInitialHoldersRangeChecksum()
        internal
        view
        virtual
        returns (bytes32)
    {
        return 0x00;
    }

    /**
     * @dev Update initial holders for a range of ids.
     */
    function _updateInitialHoldersRange(
        address[] memory fromAddresses,
        address[] memory toAddresses,
        uint[][] memory ids,
        uint[][] memory amounts,
        address[][] memory newInitialHolders,
        uint[] memory newInitialHoldersRange,
        bytes32 inputChecksum
    ) internal virtual whenPaused {
        bytes32 checksum = keccak256(
            abi.encode(
                fromAddresses,
                toAddresses,
                ids,
                amounts,
                newInitialHolders,
                newInitialHoldersRange,
                _initialHolders,
                _initialHoldersRange,
                _pauseTimestamp,
                paused(),
                _customUpdateInitialHoldersRangeChecksum()
            )
        );
        require(
            inputChecksum == checksum,
            "Invalid Input. Use verifyUpdateInitialHolderRangeInput()."
        );

        address[][] memory localInitialHolders = _initialHolders;
        uint[] memory localInitialHoldersRange = _initialHoldersRange;

        uint lastLockedIndex = _findLowerBound(
            _initialHoldersRange,
            lastRangeTokenIdWithLockedInitialHolders
        );

        for (uint k = 0; k < newInitialHolders.length; k++) {
            bool isLocked = isZeroLocked && k <= lastLockedIndex;
            if (isLocked) {
                require(
                    localInitialHoldersRange[k] == newInitialHoldersRange[k],
                    "E:18"
                );
            }
            address[] memory newInitialHolder = newInitialHolders[k];
            for (uint i = 0; i < newInitialHolder.length; i++) {
                if (isLocked) {
                    require(
                        localInitialHolders[k][i] == newInitialHolders[k][i],
                        "E:17"
                    );
                }
                _initialHoldersAddressMap[newInitialHolder[i]] = true;
            }
        }

        _initialHolders = newInitialHolders;
        _initialHoldersRange = newInitialHoldersRange;

        _unpause();
        for (uint i = 0; i < toAddresses.length; i++) {
            emit TransferBatch(
                msg.sender,
                fromAddresses[i],
                toAddresses[i],
                ids[i],
                amounts[i]
            );
        }
        super._pause();
    }

    /**
     * @dev Verify and hash input updateInitialHolderRange method.
     */
    function verifyUpdateInitialHolderRangeInput(
        address[] memory fromAddresses,
        address[] memory toAddresses,
        uint[][] memory ids,
        uint[][] memory amounts,
        address[][] memory newInitialHolders,
        uint[] memory newInitialHoldersRange
    ) public view virtual whenPaused returns (bytes32) {
        require(fromAddresses.length == toAddresses.length, "E:01");
        require(fromAddresses.length == ids.length, "E:02");
        require(fromAddresses.length == amounts.length, "E:03");
        require(
            newInitialHolders.length == newInitialHoldersRange.length,
            "E:04"
        );
        require(newInitialHoldersRange[0] == 0, "E:05");

        for (uint k = 0; k < newInitialHoldersRange.length; k++) {
            if (k > 0) {
                require(
                    newInitialHoldersRange[k] > newInitialHoldersRange[k - 1],
                    "E:06"
                );
            }
            address[] memory newInitialHolder = newInitialHolders[k];
            for (uint j = 0; j < newInitialHolder.length; j++) {
                require(newInitialHolder[j] != address(0), "E:16");
            }
        }

        for (uint i = 0; i < ids.length; i++) {
            address from = fromAddresses[i];
            address to = toAddresses[i];
            uint[] memory id = ids[i];
            uint[] memory amount = amounts[i];
            require(id.length == amount.length, "E:07");

            for (uint k = 0; k < id.length; k++) {
                uint tokenId = id[k];
                uint balance = amount[k];

                require(exists(tokenId) == true, "E:11");
                require(isManualMint[tokenId] == false, "E:12");
                require(_balances[tokenId][from] == 0, "E:13");
                require(_balances[tokenId][to] == 0, "E:14");

                require(balanceOf(from, tokenId) >= balance, "E:08");

                address[] memory currentInitialHolders = initialHolders(
                    tokenId
                );
                require(_includesAddress(currentInitialHolders, from), "E:09");

                if (isZeroLocked) {
                    require(
                        tokenId > lastRangeTokenIdWithLockedInitialHolders,
                        "E:15"
                    );
                }

                uint newInitialHoldersIndex = _findLowerBound(
                    newInitialHoldersRange,
                    tokenId
                );
                address[] memory nextInitialHolders = newInitialHolders[
                    newInitialHoldersIndex
                ];
                bool toAddressInNextInitialHolders = false;
                for (uint h = 0; h < nextInitialHolders.length; h++) {
                    if (nextInitialHolders[h] == to) {
                        toAddressInNextInitialHolders = true;
                        break;
                    }
                }
                require(toAddressInNextInitialHolders, "E:10");
            }
        }

        return
            keccak256(
                abi.encode(
                    fromAddresses,
                    toAddresses,
                    ids,
                    amounts,
                    newInitialHolders,
                    newInitialHoldersRange,
                    _initialHolders,
                    _initialHoldersRange,
                    _pauseTimestamp,
                    paused(),
                    _customUpdateInitialHoldersRangeChecksum()
                )
            );
    }
}

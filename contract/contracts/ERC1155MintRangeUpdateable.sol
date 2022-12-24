// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC1155/extensions/ERC1155Supply.sol)

pragma solidity ^0.8.0;

import "./ERC1155MintRangePausable.sol";
import "./Ph101ppDailyPhotoUtils.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "hardhat/console.sol";

/**
 * @dev Extension of ERC1155MintRange enables ability update initial holders.
 */
abstract contract ERC1155MintRangeUpdateable is ERC1155MintRangePausable {
    struct UpdateInitialHolderRangesInput {
        address[] fromAddresses;
        address[] toAddresses;
        uint[][] ids;
        uint[][] amounts;
        address[][] newInitialHolders;
    }

    struct VerifyUpdateInitialHolderRangesInput {
        address[] fromAddresses;
        address[] toAddresses;
        uint[][] ids;
        uint[][] amounts;
        address[][] newInitialHolders;
        // privates
        ERC1155MintRangeUpdateable caller;
        bytes32 customUpdateInitialHolderRangesChecksum;
    }

    uint256 public lastRangeTokenIdWithLockedInitialHolders;
    bool public isZeroLocked;

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
     * @dev Implement: May be overwritten to add custom values to checksum test.
     */
    function _customUpdateInitialHolderRangesChecksum()
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
    function _updateInitialHolderRanges(
        UpdateInitialHolderRangesInput memory input
    ) internal virtual whenPaused {
        uint lastLockedIndex = _findLowerBound(
            _initialHolderRanges,
            lastRangeTokenIdWithLockedInitialHolders
        );

        // Update initialHoldersAddress Map
        // && check no locked initial holders were updated

        require(
            input.newInitialHolders.length == _initialHolders.length,
            "E:01"
        );

        for (uint k = 0; k < input.newInitialHolders.length; k++) {
            address[] memory newInitialHolders = input.newInitialHolders[k];
            address[] memory currentInitialHolders = _initialHolders[k];
            bool isLocked = isZeroLocked && k <= lastLockedIndex;
            require(
                currentInitialHolders.length == newInitialHolders.length,
                "E:02"
            );
            bool isChanged = false;

            for (uint i = 0; i < newInitialHolders.length; i++) {
                address newInitialHolder = newInitialHolders[i];
                if (currentInitialHolders[i] != newInitialHolder) {
                    require(!isLocked, "E:03");
                    require(newInitialHolder != address(0), "E:04");
                    // require(!_ownersAddressMap[newInitialHolder], "E:05");
                    for (uint j = 0; j < newInitialHolders.length; j++) {
                        if (j != i) {
                            require(
                                newInitialHolder != newInitialHolders[j],
                                "E:06"
                            );
                        }
                    }
                    isChanged = true;
                    _initialHoldersAddressMap[newInitialHolder] = true;
                }
            }

            if (isChanged) {
                uint fromId = _initialHolderRanges[k];
                uint toId = k + 1 < _initialHolderRanges.length
                    ? _initialHolderRanges[k + 1] - 1
                    : lastRangeTokenIdMinted;
                for (uint i = 0; i < newInitialHolders.length; i++) {
                    address fromAddress = currentInitialHolders[i];
                    address toAddress = newInitialHolders[i];

                    for (uint id = fromId; id <= toId; id++) {
                        // try to initialize from-address 
                        // if there are already funds
                        // or if to-address was initialized.
                        if (isBalanceInitialized[toAddress][id] || _balances[id][toAddress] > 0) {
                            _maybeInitializeBalance(fromAddress, id);
                        } 
                        // initialize to-balance if from-address is initialized
                        if (isBalanceInitialized[fromAddress][id]) {
                            isBalanceInitialized[toAddress][id] = true;
                        }
                    }
                }
            }
        }
        // Set new initial holders (ranges cannot be changed)
        _initialHolders = input.newInitialHolders;

        // Send events
        _unpause();
        // emit "transfer" events
        for (uint i = 0; i < input.toAddresses.length; i++) {
            emit TransferBatch(
                msg.sender,
                input.fromAddresses[i],
                input.toAddresses[i],
                input.ids[i],
                input.amounts[i]
            );
        }
        _pause();
    }

    /**
     * Verifies the checksum generated by verifyUpdateInitialHolderRangesInput
     */
    function _updateInitialHolderRangesSafe(
        UpdateInitialHolderRangesInput memory input,
        bytes32 inputChecksum
    ) internal virtual whenPaused {
        bytes32 checksum = keccak256(
            abi.encode(
                input,
                _initialHolders,
                _initialHolderRanges,
                paused(),
                _customUpdateInitialHolderRangesChecksum()
            )
        );
        require(
            inputChecksum == checksum,
            "Invalid. Use verifyUpdateInitialHolderRangesInput()."
        );
        _updateInitialHolderRanges(input);
    }

    /**
     * @dev Verify and hash input updateInitialHolderRange method.
     */
    function verifyUpdateInitialHolderRangesInput(
        UpdateInitialHolderRangesInput memory input
    ) public view virtual whenPaused returns (bytes32) {
        return
            Ph101ppDailyPhotoUtils.verifyUpdateInitialHolderRangesInput(
                VerifyUpdateInitialHolderRangesInput(
                    input.fromAddresses,
                    input.toAddresses,
                    input.ids,
                    input.amounts,
                    input.newInitialHolders,
                    this,
                    _customUpdateInitialHolderRangesChecksum()
                )
            );
    }
}

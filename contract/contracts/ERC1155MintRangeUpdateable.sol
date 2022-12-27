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
        uint[] newInitialHolderRanges;
    }

    struct VerifyUpdateInitialHolderRangesInput {
        address[] fromAddresses;
        address[] toAddresses;
        uint[][] ids;
        uint[][] amounts;
        address[][] newInitialHolders;
        uint[] newInitialHolderRanges;
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
        require(tokenId > lastRangeTokenIdWithLockedInitialHolders, "Locked.");
        require(isZeroMinted && tokenId <= lastRangeTokenIdMinted, "Unminted.");
        lastRangeTokenIdWithLockedInitialHolders = tokenId;
        if (!isZeroLocked) {
            isZeroLocked = true;
        }
    }

    function _splitInitialHolderRangeAt(
        uint256 tokenId
    ) internal virtual whenNotPaused {
        require(tokenId > lastRangeTokenIdWithLockedInitialHolders, "Locked.");
        require(isZeroMinted && tokenId <= lastRangeTokenIdMinted, "Unminted.");

        uint index = _findLowerBound(_initialHolderRanges, tokenId);
        uint rangeTokenId = _initialHolderRanges[index];

        if (rangeTokenId != tokenId) {
            address[][] memory newHolders = new address[][](
                _initialHolders.length + 1
            );
            uint[] memory newRange = new uint[](
                _initialHolderRanges.length + 1
            );
            for (uint i = 0; i < _initialHolders.length + 1; i++) {
                newHolders[i] = _initialHolders[i];
                newRange[i] = _initialHolderRanges[i];
                if (i == index) {
                    newHolders[i + 1] = _initialHolders[i];
                    newRange[i + 1] = _initialHolderRanges[i];
                    i++;
                }
            }
            _initialHolders = newHolders;
            _initialHolderRanges = newRange;
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
        // uint lastLockedIndex = _findLowerBound(
        //     _initialHolderRanges,
        //     lastRangeTokenIdWithLockedInitialHolders
        // );

        // Update initialHoldersAddress Map
        // && check no locked initial holders were updated

        require(
            // range needs to start at 0
            input.newInitialHolderRanges[0] == 0 &&
                // and end before last minted id
                input.newInitialHolderRanges[
                    input.newInitialHolderRanges.length - 1
                ] <=
                lastRangeTokenIdMinted &&
                // amount of ranges & initialHolders must match
                input.newInitialHolderRanges.length ==
                input.newInitialHolders.length,
            "E:01"
        );

        uint a = 0;
        uint b = 0;

        // cycle through all overlapping range group segments
        // A: |--|–----|
        // B: |-----|--|
        // => |--|--|--|
        while (
            a <= input.newInitialHolderRanges.length &&
            b <= _initialHolderRanges.length
        ) {
            // add last minted token Id to end of range
            uint tokenA = a < input.newInitialHolderRanges.length
                ? input.newInitialHolderRanges[a]
                : lastRangeTokenIdMinted + 1;
            uint tokenB = b < _initialHolderRanges.length
                ? _initialHolderRanges[b]
                : lastRangeTokenIdMinted + 1;

            if (tokenA != tokenB) {
                // Calculate group details:
                uint fromId;
                uint toId;
                address[] memory newInitialHolders;
                address[] memory currentInitialHolders;

                if (tokenA > tokenB) {
                    uint tokenA0 = a - 1 >= 0
                        ? input.newInitialHolderRanges[a - 1]
                        : 0;
                    uint tokenB1 = b + 1 < _initialHolderRanges.length
                        ? _initialHolderRanges[b + 1]
                        : lastRangeTokenIdMinted + 1;

                    fromId = tokenA0 > tokenB ? tokenA0 : tokenB;
                    toId = (tokenB1 < tokenA ? tokenB1 : tokenA) - 1;

                    newInitialHolders = input.newInitialHolders[a - 1];
                    currentInitialHolders = _initialHolders[b];
                } else {
                    uint tokenB0 = b - 1 >= 0 ? _initialHolderRanges[b - 1] : 0;
                    uint tokenA1 = a + 1 < input.newInitialHolderRanges.length
                        ? input.newInitialHolderRanges[a + 1]
                        : lastRangeTokenIdMinted + 1;

                    fromId = tokenB0 > tokenA ? tokenB0 : tokenA;
                    toId = (tokenA1 < tokenB ? tokenA1 : tokenB) - 1;

                    newInitialHolders = input.newInitialHolders[a];
                    currentInitialHolders = _initialHolders[b - 1];
                }
                require(
                    currentInitialHolders.length == newInitialHolders.length,
                    "E:02"
                );

                // for each initial holder address in group
                for (uint i = 0; i < newInitialHolders.length; i++) {
                    address fromAddress = currentInitialHolders[i];
                    address toAddress = newInitialHolders[i];

                    // if it was updated
                    if (fromAddress != toAddress) {
                        // initialHolders cant be zero-address
                        require(toAddress != address(0), "E:04");
                        // initialHolders must be unique per tokenId
                        for (
                            uint j = i + 1;
                            j < newInitialHolders.length;
                            j++
                        ) {
                            require(toAddress != newInitialHolders[j], "E:06");
                        }

                        // add address to initial holders map
                        _initialHoldersAddressMap[toAddress] = true;

                        // for each token in range group
                        for (uint id = fromId; id <= toId; id++) {
                            // must not be locked
                            require(
                                !isZeroLocked ||
                                    id >
                                    lastRangeTokenIdWithLockedInitialHolders,
                                "E:05"
                            );
                            // initialize from-address
                            // if there are already funds in to-address
                            // or if to-address was initialized.
                            if (
                                isBalanceInitialized[toAddress][id] ||
                                _balances[id][toAddress] > 0
                            ) {
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

            // increase range with lower tokenId
            if (
                tokenA > tokenB || a + 1 > input.newInitialHolderRanges.length
            ) {
                b++;
            } else {
                a++;
            }
        }

        // Set new initial holders (ranges cannot be changed)
        _initialHolders = input.newInitialHolders;
        _initialHolderRanges = input.newInitialHolderRanges;

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
                    input.newInitialHolderRanges,
                    this,
                    _customUpdateInitialHolderRangesChecksum()
                )
            );
    }
}

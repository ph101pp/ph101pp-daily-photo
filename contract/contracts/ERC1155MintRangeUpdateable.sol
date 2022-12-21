// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC1155/extensions/ERC1155Supply.sol)

pragma solidity ^0.8.0;

import "./ERC1155MintRangePausable.sol";
import "./Ph101ppDailyPhotoUtils.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @dev Extension of ERC1155MintRange enables ability update initial holders.
 */
abstract contract ERC1155MintRangeUpdateable is ERC1155MintRangePausable {
    struct UpdateInitialHolderRangesInput {
        address[] fromAddresses;
        address[] toAddresses;
        uint[][] ids;
        uint[][] amounts;
        uint[][] initialize;
        address[][] newInitialHolders;
    }

    struct VerifyUpdateInitialHolderRangesInput {
        address[] fromAddresses;
        address[] toAddresses;
        uint[][] ids;
        uint[][] amounts;
        uint[][] initialize;
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

        require(input.newInitialHolders.length == _initialHolders.length, "E:10");

        for (uint k = 0; k < input.newInitialHolders.length; k++) {
            address[] memory newInitialHolders = input.newInitialHolders[k];
            address[] memory currentInitialHolders = _initialHolders[k];
            bool isLocked = isZeroLocked && k <= lastLockedIndex;
            require(
                currentInitialHolders.length == newInitialHolders.length,
                "E:19"
            );
            for (uint i = 0; i < newInitialHolders.length; i++) {
                address newInitialHolder = newInitialHolders[i];
                require(
                    !isLocked || currentInitialHolders[i] == newInitialHolder,
                    "E:15"
                );
                require(currentInitialHolders[i] != address(0), "E:16");
                _initialHoldersAddressMap[newInitialHolder] = true;
            }
        }

        // Set new initial holders (ranges cannot be changed)
        _initialHolders = input.newInitialHolders;

        _unpause();
        // for each affected token "transfer"
        for (uint i = 0; i < input.toAddresses.length; i++) {
            uint[] memory toInitialize = input.initialize[i];
            address toAddress = input.toAddresses[i];
            address fromAddress = input.fromAddresses[i];
            uint[] memory ids = input.ids[i];

            // initialize balances for new toAddress
            for (uint k = 0; k < toInitialize.length; k++) {
                uint idToInitialize = toInitialize[k];
                require(
                    isBalanceInitialized[fromAddress][idToInitialize] == true
                );
                isBalanceInitialized[toAddress][idToInitialize] = true;
            }

            // check that both account balances are still uninitialized
            // this means, no transfer == no amount change == no total supply diff
            for (uint k = 0; k < ids.length; k++) {
                uint idToTransfer = ids[k];
                require(
                    isBalanceInitialized[fromAddress][idToTransfer] == false &&
                        isBalanceInitialized[toAddress][idToTransfer] ==
                        false &&
                        _balances[idToTransfer][toAddress] == 0
                );
            }

            // send transfer events
            if (input.ids.length > 0) {
                emit TransferBatch(
                    msg.sender,
                    fromAddress,
                    toAddress,
                    ids,
                    input.amounts[i]
                );
            }
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
            "Invalid Input. Use verifyUpdateInitialHolderRangesInput()."
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
                    input.initialize,
                    input.newInitialHolders,
                    this,
                    _customUpdateInitialHolderRangesChecksum()
                )
            );
    }
}

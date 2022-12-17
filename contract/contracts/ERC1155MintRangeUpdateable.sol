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
    struct UpdateInitialHolderRangeInput {
        address[] fromAddresses;
        address[] toAddresses;
        uint[][] ids;
        uint[][] amounts;
        uint[][] initialize;
        address[][] newInitialHolders;
        uint[] newInitialHoldersRange;
    }

    struct VerifyUpdateInitialHolderRangeInput {
        uint fromTokenId;
        uint toTokenId;
        address[] fromAddresses;
        address[] toAddresses;
        uint[][] ids;
        uint[][] amounts;
        uint[][] initialize;
        address[][] newInitialHolders;
        uint[] newInitialHoldersRange;
        // privates
        ERC1155MintRangeUpdateable caller;
        bytes32 customUpdateInitialHoldersRangeChecksum;
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
        UpdateInitialHolderRangeInput memory input
    ) internal virtual whenPaused {
        uint lastLockedIndex = _findLowerBound(
            _initialHoldersRange,
            lastRangeTokenIdWithLockedInitialHolders
        );

        // Update initialHoldersAddress Map
        // && check no locked initial holders were updated
        for (uint k = 0; k < input.newInitialHolders.length; k++) {
            address[] memory newInitialHolders = input.newInitialHolders[k];
            bool isLocked = isZeroLocked && k <= lastLockedIndex;
            require(
                !isLocked ||
                    _initialHoldersRange[k] == input.newInitialHoldersRange[k],
                "E:18"
            );

            for (uint i = 0; i < newInitialHolders.length; i++) {
                address newInitialHolder = newInitialHolders[i];
                require(
                    !isLocked || _initialHolders[k][i] == newInitialHolder,
                    "E:15"
                );
                _initialHoldersAddressMap[newInitialHolder] = true;
            }
        }

        // Set new initial holders range
        _initialHolders = input.newInitialHolders;
        _initialHoldersRange = input.newInitialHoldersRange;

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
     * Verifies the checksum generated by verifyUpdateInitialHolderRangeInput
     */
    function _updateInitialHoldersRangeSafe(
        UpdateInitialHolderRangeInput memory input,
        bytes32 inputChecksum
    ) internal virtual whenPaused {
        bytes32 checksum = keccak256(
            abi.encode(
                input,
                _initialHolders,
                _initialHoldersRange,
                paused(),
                _customUpdateInitialHoldersRangeChecksum()
            )
        );
        require(
            inputChecksum == checksum,
            "Invalid Input. Use verifyUpdateInitialHolderRangeInput()."
        );
        _updateInitialHoldersRange(input);
    }

    /**
     * @dev Verify and hash input updateInitialHolderRange method.
     */
    function verifyUpdateInitialHolderRangeInput(
        uint fromTokenId,
        uint toTokenId,
        UpdateInitialHolderRangeInput memory input
    ) public view virtual whenPaused returns (bytes32) {
        return
            Ph101ppDailyPhotoUtils.verifyUpdateInitialHolderRangeInput(
                VerifyUpdateInitialHolderRangeInput(
                    fromTokenId,
                    toTokenId,
                    input.fromAddresses,
                    input.toAddresses,
                    input.ids,
                    input.amounts,
                    input.initialize,
                    input.newInitialHolders,
                    input.newInitialHoldersRange,
                    this,
                    _customUpdateInitialHoldersRangeChecksum()
                )
            );
    }
}

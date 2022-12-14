// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC1155/extensions/ERC1155Supply.sol)

pragma solidity ^0.8.0;

import "./ERC1155MintRange.sol";
import "./ERC1155MintRangePausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "hardhat/console.sol";

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
        UpdateInitialHolderRangeInput memory input,
        bytes32 inputChecksum
    ) internal virtual whenPaused {
        bytes32 checksum = keccak256(
            abi.encode(
                input,
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

        // Update initialHoldersAddress Map
        for (uint k = 0; k < input.newInitialHolders.length; k++) {
            address[] memory newInitialHolder = input.newInitialHolders[k];
            for (uint i = 0; i < newInitialHolder.length; i++) {
                _initialHoldersAddressMap[newInitialHolder[i]] = true;
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

            // initialize balances for new to address
            for (uint k = 0; k < toInitialize.length; k++) {
                isBalanceInitialized[toInitialize[k]][toAddress] = true;
            }

            // send transfer events
            if (input.ids.length > 0) {
                emit TransferBatch(
                    msg.sender,
                    input.fromAddresses[i],
                    toAddress,
                    input.ids[i],
                    input.amounts[i]
                );
            }
        }
        super._pause();
    }

    /**
     * @dev Verify and hash input updateInitialHolderRange method.
     */
    function verifyUpdateInitialHolderRangeInput(
        uint fromTokenId,
        uint toTokenId,
        UpdateInitialHolderRangeInput memory input,
        ERC1155MintRangeUpdateable caller,
        string memory customUpdateInitialHoldersRangeChecksum,
        uint pauseTimestamp
    ) public view virtual whenPaused returns (bytes32) {
        return
            Ph101ppDailyPhotoUtils.verifyUpdateInitialHolderRangeInput(
                fromTokenId,
                toTokenId,
                input,
                this,
                _customUpdateInitialHoldersRangeChecksum(),
                _pauseTimestamp
            );
    }
}

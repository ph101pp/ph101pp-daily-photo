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
        UpdateInitialHolderRangeInput memory input
    ) public view virtual whenPaused returns (bytes32) {
        // Verify New Initial Holders Range: //////////////////////////////////

        require(
            input.newInitialHolders.length ==
                input.newInitialHoldersRange.length,
            "E:04"
        );

        // must start with 0
        require(input.newInitialHoldersRange[0] == 0, "E:05");

        uint currentLastLockedIndex = _findLowerBound(
            _initialHoldersRange,
            lastRangeTokenIdWithLockedInitialHolders
        );

        uint newLastLockedIndex = _findLowerBound(
            input.newInitialHoldersRange,
            lastRangeTokenIdWithLockedInitialHolders
        );

        require(newLastLockedIndex == currentLastLockedIndex, "E:23");

        for (uint k = 0; k < input.newInitialHolders.length; k++) {
            // ranges must be in accending order
            if (k > 0) {
                require(
                    input.newInitialHoldersRange[k] >
                        input.newInitialHoldersRange[k - 1],
                    "E:06"
                );
            }
            // can't change locked ranges
            bool isLocked = isZeroLocked && k <= currentLastLockedIndex;
            if (isLocked) {
                require(
                    _initialHoldersRange[k] == input.newInitialHoldersRange[k],
                    "E:18"
                );
            }

            address[] memory newInitialHolder = input.newInitialHolders[k];
            for (uint i = 0; i < newInitialHolder.length; i++) {
                if (isLocked) {
                    require(
                        _initialHolders[k][i] == input.newInitialHolders[k][i],
                        "E:15"
                    );
                }

                // new initial holders cant be address0
                require(input.newInitialHolders[k][i] != address(0), "E:16");
            }
        }

        // Verify transfers: //////////////////////////////////////////////////

        require(input.fromAddresses.length == input.toAddresses.length, "E:01");
        require(input.fromAddresses.length == input.ids.length, "E:02");
        require(input.fromAddresses.length == input.amounts.length, "E:03");
        require(input.fromAddresses.length == input.initialize.length, "E:03");

        // for each affected token: "transfer" from -> to
        for (uint i = 0; i < input.toAddresses.length; i++) {
            address from = input.fromAddresses[i];
            address to = input.toAddresses[i];
            uint[] memory inits = input.initialize[i];
            uint[] memory amounts = input.amounts[i];
            uint[] memory ids = input.ids[i];

            require(ids.length == input.amounts[i].length, "E:07");

            uint idId = 0;
            uint initId = 0;
            console.log(fromTokenId, toTokenId);
            for (uint tokenId = fromTokenId; tokenId <= toTokenId; tokenId++) {
                console.log(tokenId);
                // token exists and is not manually minted
                require(exists(tokenId) == true, "E:11");
                // to address is neither initialized nor has a balance
                require(_balances[tokenId][to] == 0, "E:13");
                require(!isBalanceInitialized[tokenId][to], "E:21");

                // if token is to be transferred -> cant be initialized and must have balance.
                if (idId < ids.length && ids[idId] == tokenId) {
                    console.log("in ids");

                    // Ids must be ordered in accenting order
                    if (idId != 0) {
                        require(ids[idId - 1] < ids[idId], "E:20");
                    }

                    uint balance = amounts[idId];

                    require(balance > 0, "E:20");
                    require(balanceOf(from, tokenId) >= balance, "E:08");

                    require(_balances[tokenId][from] == 0, "E:13");
                    require(!isBalanceInitialized[tokenId][from], "E:21");

                    // Cant be manually minted
                    require(isManualMint[tokenId] == false, "E:12");

                    idId++;
                }
                // if to address is to be initialized -> from address must be initialized
                else if (initId < inits.length && inits[initId] == tokenId) {
                    console.log("in init");

                    // Ids must be ordered in accenting order
                    if (initId != 0) {
                        require(inits[initId - 1] < inits[initId], "E:20");
                    }

                    require(isBalanceInitialized[tokenId][from], "E:21");

                    // Cant be manually minted
                    require(isManualMint[tokenId] == false, "E:12");

                    initId++;
                }
                // else if token is in neither array -> its not initialized and has no balance.
                // could be manual mint.. either way -> continue
                else {
                    console.log("nope");

                    uint balance = balanceOf(from, tokenId);
                    if(balance > 0) {
                        require(isManualMint[tokenId] == true, "E:12");
                    }
                    else {
                        require(balance == 0, "E:22");
                    }
                    require(!isBalanceInitialized[tokenId][from], "E:21");

                    // nothing is going to happen to this token;
                    continue;
                }

                // from is in existing initialHolders
                address[] memory currentInitialHolders = initialHolders(
                    tokenId
                );
                require(_includesAddress(currentInitialHolders, from), "E:09");

                uint newInitialHoldersIndex = _findLowerBound(
                    input.newInitialHoldersRange,
                    tokenId
                );

                // to is in new initialHolders
                require(
                    _includesAddress(
                        input.newInitialHolders[newInitialHoldersIndex],
                        to
                    ),
                    "E:10"
                );

                // tokenId is not in locked range
                if (isZeroLocked) {
                    require(
                        tokenId > lastRangeTokenIdWithLockedInitialHolders,
                        "E:15"
                    );
                }
            }
        }

        return
            keccak256(
                abi.encode(
                    input,
                    _initialHolders,
                    _initialHoldersRange,
                    _pauseTimestamp,
                    paused(),
                    _customUpdateInitialHoldersRangeChecksum()
                )
            );
    }
}

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC1155/extensions/ERC1155Supply.sol)

pragma solidity ^0.8.0;

import "./ERC1155_.sol";
import "hardhat/console.sol";

/**
 * @dev Extension of ERC1155 enables mintRange with dynamic initial balance
 * and adds tracking of total supply per id.
 */
abstract contract ERC1155DynamicInitialBalances is ERC1155_ {
    string private constant ERROR_INVALID_INPUT_MINT_RANGE =
        "Invalid input, use getMintRangeInput() to generate valid input params.";

    // Mapping from token ID to balancesInitialzed flag
    mapping(uint256 => bool) private _balancesInitialized;

    // Track initial holders across tokenID ranges;
    address[][] private _initialHolders;
    uint256[] private _initialHoldersRange;

    // Mapping from token ID to totalSupply
    mapping(uint256 => uint256) private _totalSupply;

    uint256 public _lastConsecutiveTokenId = 0;
    bool private zeroMinted = false;

    /**
     * @dev Implement: Return token balance for each address.
     * This function MUST be pure: Always return the same values for a given input.
     */
    function initialBalanceOf(address account, uint256 tokenId)
        public
        view
        virtual
        returns (uint256);

    /**
     * @dev Set initial holders. mintRange will distribute tokens to these holders
     */
    function _setInitialHolders(address[] memory addresses) internal virtual {
        _initialHoldersRange.push(zeroMinted ? _lastConsecutiveTokenId + 1 : 0);
        _initialHolders.push(addresses);
    }

    /**
     * @dev Lazy-mint a range of new tokenIds to initial holders
     */
    function _mintRange(uint256[] memory ids, uint256[][] memory amounts)
        internal
        virtual
    {
        address[] memory addresses = initialHolders(ids[0]);
        require(
            ids[0] == _lastConsecutiveTokenId + 1 ||
                (zeroMinted == false && ids[0] == _lastConsecutiveTokenId),
            ERROR_INVALID_INPUT_MINT_RANGE
        );
        require(
            ids[ids.length - 1] == _lastConsecutiveTokenId + ids.length ||
                (zeroMinted == false &&
                    ids[ids.length - 1] ==
                    _lastConsecutiveTokenId + ids.length - 1),
            ERROR_INVALID_INPUT_MINT_RANGE
        );
        require(
            addresses.length == amounts.length &&
                ids.length == amounts[0].length &&
                ids.length == amounts[addresses.length - 1].length,
            ERROR_INVALID_INPUT_MINT_RANGE
        );

        _lastConsecutiveTokenId = ids[ids.length - 1];

        if (zeroMinted == false) {
            zeroMinted = true;
        }

        for (uint i = 0; i < addresses.length; i++) {
            emit TransferBatch(
                msg.sender,
                address(0),
                addresses[i],
                ids,
                amounts[i]
            );
        }
    }

    /**
     * @dev See {ERC1155-_mint}.
     *
     * Requirements:
     * - token must be preminted with dynamic supply via mintRange.
     */
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual override {
        require(id <= _lastConsecutiveTokenId);
        super._mint(to, id, amount, data);
    }

    /**
     * @dev See {ERC1155-_mintBatch}.
     *
     * Requirements
     * - token must be preminted with dynamic supply via mintRange.
     */
    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        for (uint256 i = 0; i < ids.length; ++i) {
            require(ids[i] <= _lastConsecutiveTokenId);
        }
        super._mintBatch(to, ids, amounts, data);
    }

    /**
     * @dev Returns true if tokenId was minted.
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return tokenId <= _lastConsecutiveTokenId;
    }

    /**
     * @dev See {ERC1155-balanceOf}.
     */
    function balanceOf(address account, uint256 id)
        public
        view
        override
        returns (uint256)
    {
        require(
            account != address(0),
            "ERC1155: address zero is not a valid owner"
        );

        // Pre initialization
        if (_balancesInitialized[id] == false) {
            if (exists(id)) {
                address[] memory addresses = initialHolders(id);
                for (uint i = 0; i < addresses.length; i++) {
                    if (account == addresses[i]) {
                        return initialBalanceOf(account, id);
                    }
                }
            }
            return 0;
        }

        // Post initialization
        return _balances[id][account];
    }

    /**
     * @dev Returns initial holders of a token.
     */
    function initialHolders(uint256 tokenId)
        public
        view
        virtual
        returns (address[] memory)
    {
        require(
            _initialHolders.length > 0,
            "No initial holders set. Use _setInitialHolders()"
        );
        uint index = _findInRange(_initialHoldersRange, tokenId);
        return _initialHolders[index];
    }

    /**
     * @dev Total amount of tokens with a given id.
     */
    function totalSupply(uint256 tokenId)
        public
        view
        virtual
        returns (uint256)
    {
        // Pre initialization
        if (exists(tokenId) && _balancesInitialized[tokenId] == false) {
            uint256 totalSupplySum = 0;
            address[] memory initialHolderAddresses = initialHolders(tokenId);
            for (uint i = 0; i < initialHolderAddresses.length; i++) {
                totalSupplySum += initialBalanceOf(
                    initialHolderAddresses[i],
                    tokenId
                );
            }
            return totalSupplySum;
        }

        // Post initialization
        return _totalSupply[tokenId];
    }

    /**
     * @dev Convenience method to generate mintRange inputs
     */
    function getMintRangeInput(uint256 numberOfTokens)
        public
        view
        returns (uint256[] memory, uint256[][] memory)
    {
        uint256 firstId = zeroMinted ? _lastConsecutiveTokenId + 1 : 0;
        address[] memory addresses = initialHolders(firstId);
        uint256[] memory ids = new uint256[](numberOfTokens);
        uint256[][] memory amounts = new uint256[][](addresses.length);

        for (uint a = 0; a < addresses.length; a++) {
            amounts[a] = new uint256[](ids.length);
        }
        for (uint i = 0; i < numberOfTokens; i++) {
            ids[i] = firstId + i;

            for (uint b = 0; b < addresses.length; b++) {
                amounts[b][i] = initialBalanceOf(addresses[b], ids[i]);
            }
        }

        return (ids, amounts);
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        // initialize balances if minted via _mintBatchDynamic

        for (uint256 i = 0; i < ids.length; ++i) {
            _maybeInitializeBalance(ids[i]);
        }

        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        // Track supply
        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _totalSupply[ids[i]] += amounts[i];
            }
        }

        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                uint256 supply = _totalSupply[id];
                require(
                    supply >= amount,
                    "ERC1155: burn amount exceeds totalSupply"
                );
                unchecked {
                    _totalSupply[id] = supply - amount;
                }
            }
        }
    }

    /**
     * @dev Writes dynamic initial Balance to state if uninitialized.
     */
    function _maybeInitializeBalance(uint256 id) private {
        // Pre initialization
        if (_balancesInitialized[id] == false) {
            address[] memory addresses = initialHolders(id);
            uint256 totalSupplySum = 0;
            for (uint i = 0; i < addresses.length; i++) {
                address account = addresses[i];
                uint256 balance = initialBalanceOf(account, id);

                totalSupplySum += balance;
                _balances[id][account] = balance;
            }
            _totalSupply[id] = totalSupplySum;
            _balancesInitialized[id] = true;
        }

        // Post initialization
        // no-op
    }

    /**
     * @dev Utility find range/bucket current tokenId belongs to.
     */
    function _findInRange(uint256[] memory range, uint256 tokenId)
        internal
        pure
        returns (uint256)
    {
        for (uint256 i = range.length - 1; i >= 0; i--) {
            if (tokenId >= range[i]) {
                return i;
            }
        }
        return 0;
    }
}

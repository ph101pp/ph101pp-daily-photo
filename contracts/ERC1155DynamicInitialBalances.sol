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
    string private constant ERROR_NO_INITIAL_HOLDERS =
        "No initial holders set. Use _setInitialHolders()";

    // Mapping from token ID to balancesInitialzed flag
    mapping(uint256 => mapping(address => bool)) private _balancesInitialized;

    // Mapping to keep track of tokens that are minted via ERC1155._mint() or  ERC1155._mintBatch()
    mapping(uint256 => bool) private _standardMint;

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
    function _safeMintRange(
        address[] memory addresses,
        uint256[] memory ids,
        uint256[][] memory amounts
    ) internal virtual {
        address[] memory currentInitialHolders = initialHolders();
        uint256 firstId = zeroMinted ? _lastConsecutiveTokenId + 1 : 0;
        uint256 lastId = firstId + ids.length - 1;

        require(
            ids[0] == firstId && ids[ids.length - 1] == lastId,
            ERROR_INVALID_INPUT_MINT_RANGE
        );

        for (uint i = 0; i < addresses.length; i++) {
            require(
                addresses[i] == currentInitialHolders[i],
                "Provided addresses do not match current initialHolders"
            );
        }
        _mintRange(addresses, ids, amounts);
    }

    /**
     * @dev Lazy-mint a range of new tokenIds to initial holders
     */
    function _mintRange(
        address[] memory addresses,
        uint256[] memory ids,
        uint256[][] memory amounts
    ) internal virtual {
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
     * @dev Returns true if tokenId was minted.
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _inRange(tokenId) || _standardMint[tokenId] == true;
    }

    /**
     * @dev Returns true if token is in existing id range.
     */
    function _inRange(uint256 tokenId) private view returns (bool) {
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
        if (
            _inRange(id) &&
            !_balancesInitialized[id][account] &&
            !_standardMint[id]
        ) {
            address[] memory addresses = initialHolders(id);
            for (uint i = 0; i < addresses.length; i++) {
                if (account == addresses[i]) {
                    return initialBalanceOf(account, id);
                }
            }
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
        require(_initialHolders.length > 0, ERROR_NO_INITIAL_HOLDERS);
        uint index = _findInRange(_initialHoldersRange, tokenId);
        return _initialHolders[index];
    }

    /**
     * @dev Return current initial holders
     */
    function initialHolders() public view virtual returns (address[] memory) {
        require(_initialHolders.length > 0, ERROR_NO_INITIAL_HOLDERS);
        return _initialHolders[_initialHolders.length - 1];
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
        if (_inRange(tokenId) && !_standardMint[tokenId]) {
            uint256 totalSupplySum = _totalSupply[tokenId];
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
        returns (
            address[] memory,
            uint256[] memory,
            uint256[][] memory
        )
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

        return (addresses, ids, amounts);
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
        // initialize balances if minted via _mintRange
        // or set _standardMint flag if minted via _mint||_mintBatch
        for (uint256 i = 0; i < ids.length; ++i) {
            if (from == address(0) && !exists(ids[i])) {
                _standardMint[ids[i]] = true;
            }
            _maybeInitializeBalance(from, ids[i]);
            _maybeInitializeBalance(to, ids[i]);
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
    function _maybeInitializeBalance(address account, uint256 id) private {
        // Pre initialization
        if (
            _inRange(id) &&
            !_balancesInitialized[id][account] &&
            !_standardMint[id]
        ) {
            _balancesInitialized[id][account] = true;
            address[] memory addresses = initialHolders(id);
            for (uint i = 0; i < addresses.length; i++) {
                if (account == addresses[i]) {
                    _balances[id][account] = initialBalanceOf(account, id);
                    return;
                }
            }
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

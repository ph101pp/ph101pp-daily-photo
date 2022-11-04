// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155MintRangeUpdateable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "./DateTime.sol";

contract Ph101ppDailyPhoto is
    ERC1155MintRangeUpdateable,
    ERC2981,
    AccessControl
{
    string private constant ERROR_NO_INITIAL_SUPPLY =
        "No max initial supply set. Use _setMaxInitialSupply()";
    uint public constant START_DATE = 1661990400; // Sept 1, 2022
    bytes32 public constant URI_UPDATER_ROLE = keccak256("URI_UPDATER_ROLE");
    bytes32 public constant CLAIM_MINTER_ROLE = keccak256("CLAIM_MINTER_ROLE");
    bytes32 public constant PHOTO_MINTER_ROLE = keccak256("PHOTO_MINTER_ROLE");
    uint public constant CLAIM_TOKEN_ID = 0;
    string private constant CLAIM_TOKEN = "CLAIM";

    uint private constant TREASURY_ID = 0;
    uint private constant VAULT_ID = 1;

    string[] private _permanentUris;
    string private _proxyUri;
    uint public lastRangeTokenIdWithPermanentUri;

    uint[] private _maxSupplies;
    uint[] private _maxSupplyRange;
    bool public isInitialHoldersRangeUpdatePermanentlyDisabled;

    constructor(
        string memory newProxyUri,
        string memory newPermanentUri,
        address treasuryAddress,
        address vaultAddress
    ) ERC1155_("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CLAIM_MINTER_ROLE, msg.sender);
        _grantRole(PHOTO_MINTER_ROLE, msg.sender);
        _grantRole(URI_UPDATER_ROLE, msg.sender);

        setProxyBaseUri(newProxyUri);
        setPermanentBaseUriUpTo(newPermanentUri, 0);
        setInitialHolders(treasuryAddress, vaultAddress);
        setDefaultRoyalty(msg.sender, 500);
        mintClaims(treasuryAddress, 10);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Token Balances
    ///////////////////////////////////////////////////////////////////////////////

    function initialBalanceOf(address account, uint tokenId)
        internal
        view
        override
        returns (uint)
    {
        address[] memory addresses = initialHolders(tokenId);
        if (account == addresses[TREASURY_ID]) {
            uint maxSupply = maxInitialSupply(tokenId);
            uint supply = (uint(
                keccak256(abi.encode(tokenId, address(this), maxSupply))
            ) % maxSupply) + 1;

            return supply;
        }

        if (account == addresses[VAULT_ID]) {
            return 1;
        }

        return 0;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Uris
    ///////////////////////////////////////////////////////////////////////////////

    function uri(uint tokenId) public view override returns (string memory) {
        string memory tokenDate;
        string memory currentUri;
        // token...
        if (tokenId == CLAIM_TOKEN_ID) {
            // ... is claim -> return claim
            tokenDate = CLAIM_TOKEN;
            currentUri = proxyBaseUri();
        } else {
            (uint year, uint month, uint day) = tokenIdToDate(tokenId);

            tokenDate = string.concat(
                Strings.toString(year),
                month <= 9 ? "0" : "",
                Strings.toString(month),
                day <= 9 ? "0" : "",
                Strings.toString(day)
            );

            if (
                exists(tokenId) && lastRangeTokenIdWithPermanentUri >= tokenId
            ) {
                // ... uri updated since token -> immutable uri
                currentUri = permanentBaseUri();
            } else {
                // ... uri not yet updated since token -> mutable uri
                currentUri = proxyBaseUri();
            }
        }

        return string.concat(currentUri, tokenDate, ".json");
    }

    function proxyBaseUri() public view returns (string memory) {
        return _proxyUri;
    }

    function permanentBaseUri() public view returns (string memory) {
        return _permanentUris[_permanentUris.length - 1];
    }

    function permanentBaseUriHistory() public view returns (string[] memory) {
        return _permanentUris;
    }

    function setPermanentBaseUriUpTo(
        string memory newUri,
        uint validUpToTokenId
    ) public whenNotPaused onlyRole(URI_UPDATER_ROLE) {
        require(
            validUpToTokenId > lastRangeTokenIdWithPermanentUri ||
                _permanentUris.length == 0,
            "Error: TokenId must be larger than lastTokenIdWithValidPermanentUri."
        );
        _permanentUris.push(newUri);
        lastRangeTokenIdWithPermanentUri = validUpToTokenId;
    }

    function setProxyBaseUri(string memory newProxyUri)
        public
        whenNotPaused
        onlyRole(URI_UPDATER_ROLE)
    {
        _proxyUri = newProxyUri;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Claims
    ///////////////////////////////////////////////////////////////////////////////

    function mintClaims(address to, uint amount)
        public
        onlyRole(CLAIM_MINTER_ROLE)
    {
        _mint(to, CLAIM_TOKEN_ID, amount, "");
    }

    function redeemClaim(uint tokenId) public {
        address[] memory initialHolders = initialHolders(tokenId);
        _burn(msg.sender, CLAIM_TOKEN_ID, 1);
        _safeTransferFrom(
            initialHolders[TREASURY_ID],
            msg.sender,
            tokenId,
            1,
            ""
        );
    }

    function redeemClaimBatch(uint[] memory tokenIds, uint[] memory amounts)
        public
    {
        uint claimsRequired = amounts[0];
        address[] memory initialHolders0 = initialHolders(tokenIds[0]);
        for (uint i = 1; i < amounts.length; i++) {
            claimsRequired += amounts[i];
            require(
                initialHolders0[TREASURY_ID] ==
                    initialHolders(tokenIds[i])[TREASURY_ID],
                "Can't batch claim tokens from multiple treasury wallets."
            );
        }
        _burn(msg.sender, CLAIM_TOKEN_ID, claimsRequired);
        _safeBatchTransferFrom(
            initialHolders0[TREASURY_ID],
            msg.sender,
            tokenIds,
            amounts,
            ""
        );
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Mint Photos
    ///////////////////////////////////////////////////////////////////////////////

    function mintPhotos(
        uint[] memory ids,
        uint[][] memory amounts,
        bytes32 checkSum
    ) public onlyRole(PHOTO_MINTER_ROLE) {
        _mintRange(ids, amounts, checkSum);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Initial Supply
    ///////////////////////////////////////////////////////////////////////////////

    function setMaxInitialSupply(uint maxSupply)
        public
        whenNotPaused
        onlyRole(PHOTO_MINTER_ROLE)
    {
        uint firstId = isZeroMinted ? lastRangeTokenIdMinted + 1 : 0;
        if (_maxSupplies.length > 0) {
            uint lastId = _maxSupplyRange[_maxSupplyRange.length - 1];
            if (lastId == firstId) {
                _maxSupplies[_maxSupplies.length - 1] = maxSupply;
                return;
            }
        }
        _maxSupplyRange.push(firstId);
        _maxSupplies.push(maxSupply);
    }

    /**
     * @dev Returns max initial supply of a token.
     */
    function maxInitialSupply(uint tokenId) public view returns (uint) {
        require(_maxSupplies.length > 0, ERROR_NO_INITIAL_SUPPLY);
        uint supplyIndex = _findInRange(_maxSupplyRange, tokenId);
        return _maxSupplies[supplyIndex];
    }

    /**
     * @dev Returns max initial supply of a token.
     */
    function maxInitialSupply() public view returns (uint) {
        require(_maxSupplies.length > 0, ERROR_NO_INITIAL_SUPPLY);
        return _maxSupplies[_maxSupplies.length - 1];
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Initial Holders
    ///////////////////////////////////////////////////////////////////////////////

    function setInitialHolders(address treasury, address vault)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        address[] memory addresses = new address[](2);
        addresses[0] = treasury;
        addresses[1] = vault;
        _setInitialHolders(addresses);
    }

    /**
     * @dev Lock initial holders up to tokenid
     */
    function setLockInitialHoldersUpTo(uint256 tokenId)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setLockInitialHoldersUpTo(tokenId);
    }

    function updateInitialHoldersRange(
        address[] memory fromAddresses,
        address[] memory toAddresses,
        uint[][] memory ids,
        uint[][] memory amounts,
        address[][] memory newInitialHolders,
        uint[] memory newInitialHoldersRange,
        bytes32 inputChecksum
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isInitialHoldersRangeUpdatePermanentlyDisabled);
        _updateInitialHoldersRange(
            fromAddresses,
            toAddresses,
            ids,
            amounts,
            newInitialHolders,
            newInitialHoldersRange,
            inputChecksum
        );
    }

    function permanentlyDisableInitialHoldersRangeUpdate()
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        isInitialHoldersRangeUpdatePermanentlyDisabled = true;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Royalties
    ///////////////////////////////////////////////////////////////////////////////

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        public
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(
        uint tokenId,
        address receiver,
        uint96 feeNumerator
    ) public whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function resetTokenRoyalty(uint tokenId)
        public
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _resetTokenRoyalty(tokenId);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Pausable
    ///////////////////////////////////////////////////////////////////////////////

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Token ID < > Date helpers
    ///////////////////////////////////////////////////////////////////////////////
    function tokenIdToDate(uint tokenId)
        public
        pure
        returns (
            uint year,
            uint month,
            uint day
        )
    {
        require(tokenId > 0, "No date associated with claims!"); // No date associated with claims!
        uint tokenTimestamp = _timestampFromTokenId(tokenId);
        return _timestampToDate(tokenTimestamp);
    }

    function tokenIdFromDate(
        uint year,
        uint month,
        uint day
    ) public pure returns (uint tokenId) {
        require(DateTime.isValidDate(year, month, day), "Invalid date!");
        uint tokenTimestamp = DateTime.timestampFromDate(year, month, day);
        require(
            tokenTimestamp >= START_DATE,
            "Invalid date! Project started September 1, 2022!"
        );
        return _timestampToTokenId(tokenTimestamp);
    }

    function _timestampToDate(uint timestamp)
        private
        pure
        returns (
            uint year,
            uint month,
            uint day
        )
    {
        return DateTime.timestampToDate(timestamp);
    }

    function _timestampFromTokenId(uint tokenId)
        private
        pure
        returns (uint timestamp)
    {
        return START_DATE + ((tokenId - 1) * 1 days);
    }

    function _timestampToTokenId(uint timestamp)
        private
        pure
        returns (uint tokenId)
    {
        return ((timestamp - START_DATE) / 1 days) + 1;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Interface
    ///////////////////////////////////////////////////////////////////////////////

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, ERC1155_, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

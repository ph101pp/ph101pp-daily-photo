// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155MintRangeUpdateable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "./DateTime.sol";
import "./OpenseaOperatorFilterer.sol";

contract Ph101ppDailyPhoto is
    ERC1155MintRangeUpdateable,
    ERC2981,
    AccessControl,
    OpenseaOperatorFilterer
{
    uint public constant START_DATE = 1661990400; // Sept 1, 2022
    bytes32 public constant URI_UPDATER_ROLE = keccak256("URI_UPDATER_ROLE");
    bytes32 public constant CLAIM_MINTER_ROLE = keccak256("CLAIM_MINTER_ROLE");
    bytes32 public constant PHOTO_MINTER_ROLE = keccak256("PHOTO_MINTER_ROLE");
    uint public constant CLAIM_TOKEN_ID = 0;
    string private constant _CLAIM_TOKEN = "CLAIM";

    uint private constant TREASURY_ID = 0;
    uint private constant VAULT_ID = 1;

    uint[][] private _initialSupplies;
    uint[] private _initialSupplyRange;
    string[] private _permanentUris;
    uint[] private _permanentUriRange;
    string private _proxyUri;

    uint public lastRangeTokenIdWithPermanentUri;
    bool public isInitialHoldersRangeUpdatePermanentlyDisabled;

    address private _owner;

    constructor(
        string memory newProxyUri,
        string memory newPermanentUri,
        address[] memory initialHolders
    ) ERC1155_("") ERC1155MintRange(initialHolders) {
        // require(initialHolders.length == 2);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CLAIM_MINTER_ROLE, msg.sender);
        _grantRole(PHOTO_MINTER_ROLE, msg.sender);
        _grantRole(URI_UPDATER_ROLE, msg.sender);
        _subscribeToOpenseaOperatorFilterRegistry();

        // set initial max supply to 2-3;
        _initialSupplyRange.push(0);
        _initialSupplies.push([2, 3]);

        _permanentUris.push(newPermanentUri);
        _permanentUriRange.push(0);

        _proxyUri = newProxyUri;
        _owner = msg.sender;
        _setDefaultRoyalty(msg.sender, 500);
        mintClaims(initialHolders[TREASURY_ID], 10);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Token Balances
    ///////////////////////////////////////////////////////////////////////////////

    function initialBalanceOf(
        address account,
        uint tokenId
    ) internal view override returns (uint) {
        address[] memory addresses = initialHolders(tokenId);
        if (account == addresses[TREASURY_ID]) {
            uint[] memory _initialSupply = initialSupply(tokenId);
            uint supply = (uint(
                keccak256(abi.encode(tokenId, address(this), _initialSupply))
            ) % (_initialSupply[1] - _initialSupply[0] + 1)) +
                _initialSupply[0];

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
        string memory currentUri;

        if (exists(tokenId) && lastRangeTokenIdWithPermanentUri >= tokenId) {
            // ... uri updated since token -> immutable uri
            currentUri = permanentBaseUri();
        } else {
            // ... uri not yet updated since token -> mutable uri
            currentUri = proxyBaseUri();
        }

        return
            string.concat(currentUri, tokenSlugFromTokenId(tokenId), ".json");
    }

    function proxyBaseUri() public view returns (string memory) {
        return _proxyUri;
    }

    function firstPermanentUri(uint tokenId) public view returns (string memory) {
        require(tokenId <= lastRangeTokenIdWithPermanentUri);
        uint permanentUriIndex = _findInRange(_permanentUriRange, tokenId);
        return
            string.concat(
                _permanentUris[permanentUriIndex],
                tokenSlugFromTokenId(tokenId),
                ".json"
            );
    }

    function permanentBaseUri() public view returns (string memory) {
        return _permanentUris[_permanentUris.length - 1];
    }

    function permanentBaseUriHistory()
        public
        view
        returns (string[] memory, uint256[] memory)
    {
        return (_permanentUris, _permanentUriRange);
    }

    function setPermanentBaseUriUpTo(
        string memory newUri,
        uint validUpToTokenId
    ) public whenNotPaused onlyRole(URI_UPDATER_ROLE) {
        require(
            validUpToTokenId > lastRangeTokenIdWithPermanentUri,
            "Error: TokenId <= lastTokenIdWithValidPermanentUri."
        );
        _permanentUris.push(newUri);
        _permanentUriRange.push(lastRangeTokenIdWithPermanentUri + 1);
        lastRangeTokenIdWithPermanentUri = validUpToTokenId;
    }

    function setProxyBaseUri(
        string memory newProxyUri
    ) public whenNotPaused onlyRole(URI_UPDATER_ROLE) {
        _proxyUri = newProxyUri;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Claims
    ///////////////////////////////////////////////////////////////////////////////

    function mintClaims(
        address to,
        uint amount
    ) public onlyRole(CLAIM_MINTER_ROLE) {
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

    function redeemClaimBatch(
        uint[] memory tokenIds,
        uint[] memory amounts
    ) public {
        uint claimsRequired = amounts[0];
        address[] memory initialHolders0 = initialHolders(tokenIds[0]);
        for (uint i = 1; i < amounts.length; i++) {
            claimsRequired += amounts[i];
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
    // Mint Photos (Mint Range)
    ///////////////////////////////////////////////////////////////////////////////

    function mintPhotos(
        uint[] memory ids,
        uint[][] memory amounts,
        bytes32 checkSum
    ) public onlyRole(PHOTO_MINTER_ROLE) {
        _mintRange(ids, amounts, checkSum);
    }

    function _customMintRangeChecksum()
        internal
        view
        override
        returns (bytes32)
    {
        return keccak256(abi.encode(_initialSupplies));
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Initial Supply
    ///////////////////////////////////////////////////////////////////////////////

    function setInitialSupply(
        uint[] memory newInitialSupply
    ) public whenNotPaused onlyRole(PHOTO_MINTER_ROLE) {
        require(
            newInitialSupply.length == 2 &&
                newInitialSupply[0] <= newInitialSupply[1]
        );
        uint firstId = lastRangeTokenIdMinted + 1;
        uint lastId = _initialSupplyRange[_initialSupplyRange.length - 1];
        if (lastId == firstId) {
            _initialSupplies[_initialSupplies.length - 1] = newInitialSupply;
            return;
        }
        _initialSupplyRange.push(firstId);
        _initialSupplies.push(newInitialSupply);
    }

    /**
     * @dev Returns initial supply of a token.
     */
    function initialSupply(uint tokenId) public view returns (uint[] memory) {
        uint supplyIndex = _findInRange(_initialSupplyRange, tokenId);
        return _initialSupplies[supplyIndex];
    }

    /**
     * @dev Returns initial supply of future tokens.
     */
    function initialSupply() public view returns (uint[] memory) {
        return _initialSupplies[_initialSupplies.length - 1];
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Initial Holders
    ///////////////////////////////////////////////////////////////////////////////

    function setInitialHolders(
        address treasury,
        address vault
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        address[] memory addresses = new address[](2);
        addresses[0] = treasury;
        addresses[1] = vault;
        _setInitialHolders(addresses);
    }

    /**
     * @dev Lock initial holders up to tokenid
     */
    function setLockInitialHoldersUpTo(
        uint256 tokenId
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
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
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        isInitialHoldersRangeUpdatePermanentlyDisabled = true;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Royalties
    ///////////////////////////////////////////////////////////////////////////////

    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) public whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(
        uint tokenId,
        address receiver,
        uint96 feeNumerator
    ) public whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function resetTokenRoyalty(
        uint tokenId
    ) public whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) {
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
    function tokenSlugFromTokenId(
        uint tokenId
    ) public pure returns (string memory tokenSlug) {
        if (tokenId == CLAIM_TOKEN_ID) {
            return
                string.concat(
                    _CLAIM_TOKEN,
                    "-",
                    Strings.toString(CLAIM_TOKEN_ID)
                );
        }
        (uint year, uint month, uint day) = DateTime.timestampToDate(
            START_DATE + ((tokenId - 1) * 1 days)
        );
        return _tokenSlug(tokenId, year, month, day);
    }

    function tokenSlugFromDate(
        uint year,
        uint month,
        uint day
    ) public pure returns (string memory tokenSlug) {
        require(DateTime.isValidDate(year, month, day), "Invalid date!");
        uint tokenTimestamp = DateTime.timestampFromDate(year, month, day);
        require(
            tokenTimestamp >= START_DATE,
            "Invalid date! Project started September 1, 2022!"
        );
        return
            _tokenSlug(
                (((tokenTimestamp - START_DATE) / 1 days) + 1),
                year,
                month,
                day
            );
    }

    function _tokenSlug(
        uint tokenId,
        uint year,
        uint month,
        uint day
    ) private pure returns (string memory tokenSlug) {
        return
            string.concat(
                Strings.toString(year),
                month <= 9 ? "0" : "",
                Strings.toString(month),
                day <= 9 ? "0" : "",
                Strings.toString(day),
                "-",
                Strings.toString(tokenId)
            );
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Opensea Operator Filterer
    ///////////////////////////////////////////////////////////////////////////////

    function owner() public view override returns (address) {
        return _owner;
    }

    /**
     * @dev Set new owner. This address will be returned by owner().
     * Can be used to make updates to the OperatorFilterRegistry on behalf of this contract.
     */
    function setOwner(
        address newOwner
    ) public whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) {
        _owner = newOwner;
    }

    function setOperatorFilterRegistry(
        address _operatorFilterRegistry
    ) public whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) {
        _setOperatorFilterRegistry(_operatorFilterRegistry);
    }

    function permanentlyDisableOperatorFilter()
        public
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _permanentlyDisableOperatorFilter();
    }

    function setApprovalForAll(
        address operator,
        bool approved
    ) public override whenNotPaused onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override onlyAllowedOperator(from) {
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Interface
    ///////////////////////////////////////////////////////////////////////////////

    // The following functions are overrides required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, ERC1155_, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

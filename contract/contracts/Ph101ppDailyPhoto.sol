// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155MintRangeUpdateable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
// import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "./Ph101ppDailyPhotoUtils.sol";
import "./IPh101ppDailyPhotoListener.sol";
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

    address public transferEventListenerAddress;
    // bool public isTransferEventListenerAddressPermanentlyFrozen = false;

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

    // Defines initial balances for "lazy" minted photo nfts
    function initialBalanceOf(
        address account,
        uint tokenId
    ) internal view override returns (uint) {
        address[] memory addresses = initialHolders(tokenId);

        // if account is treasury account:
        if (account == addresses[TREASURY_ID]) {
            uint[] memory _initialSupply = initialSupply(tokenId);

            // calculate deterministic random initial balance between min / max initialSupply.
            uint supply = (uint(
                keccak256(abi.encode(tokenId, address(this), _initialSupply))
            ) % (_initialSupply[1] - _initialSupply[0] + 1)) +
                _initialSupply[0];

            return supply;
        }

        // if account is vault account initial balance is 1
        if (account == addresses[VAULT_ID]) {
            return 1;
        }

        // all other accounts have no initial balance
        return 0;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Uris
    ///////////////////////////////////////////////////////////////////////////////

    // Returns permanent uri where already available, otherwise proxy uri.
    function uri(uint tokenId) public view override returns (string memory) {
        if (exists(tokenId) && lastRangeTokenIdWithPermanentUri >= tokenId) {
            // ... uri updated since token -> immutable uri
            return
                string.concat(
                    permanentBaseUri(),
                    tokenSlugFromTokenId(tokenId)
                );
        }
        // else ... uri not yet updated since token -> mutable uri
        return
            string.concat(
                proxyBaseUri(),
                tokenSlugFromTokenId(tokenId)
            );
    }

    // Returns proxy base Uri that is used for
    // tokens not included in the permanent Uris yet.
    function proxyBaseUri() public view returns (string memory) {
        return _proxyUri;
    }

    // Returns all histoical uris that include tokenId
    function uriHistory(uint tokenId) public view returns (string[] memory) {
        if (tokenId > lastRangeTokenIdWithPermanentUri) {
            return new string[](0);
        }
        uint permanentUriIndex = Ph101ppDailyPhotoUtils.findLowerBound(
            _permanentUriRange,
            tokenId
        );
        string memory slug = tokenSlugFromTokenId(tokenId);
        string[] memory history = new string[](
            _permanentUris.length - permanentUriIndex
        );
        for (uint i = permanentUriIndex; i < _permanentUris.length; i++) {
            history[i - permanentUriIndex] = string.concat(
                _permanentUris[i],
                slug
            );
        }
        return history;
    }

    // Returns latest permanent base Uri
    function permanentBaseUri() public view returns (string memory) {
        return _permanentUris[_permanentUris.length - 1];
    }

    // Returns all historical permanent base Uris for the record.
    function permanentBaseUriHistory()
        public
        view
        returns (string[] memory, uint256[] memory)
    {
        return (_permanentUris, _permanentUriRange);
    }

    // Updates latest permanent base Uri.
    // New uri must include more token Ids than previous one.
    function setPermanentBaseUriUpTo(
        string memory newUri,
        uint validUpToTokenId
    ) public whenNotPaused onlyRole(URI_UPDATER_ROLE) {
        require(
            validUpToTokenId > lastRangeTokenIdWithPermanentUri &&
                validUpToTokenId <= lastRangeTokenIdMinted,
            "Required: lastIdWithPermanentUri < TokenId <= lastIdMinted."
        );
        // require(newUri[newUri.length-1] == "/");
        _permanentUris.push(newUri);
        _permanentUriRange.push(lastRangeTokenIdWithPermanentUri + 1);
        lastRangeTokenIdWithPermanentUri = validUpToTokenId;
    }

    // Update proxy base Uri that is used for
    // tokens not included in the permanent Uris yet.
    function setProxyBaseUri(
        string memory newProxyUri
    ) public whenNotPaused onlyRole(URI_UPDATER_ROLE) {
        _proxyUri = newProxyUri;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Claims
    ///////////////////////////////////////////////////////////////////////////////

    // Mint new claims to a wallet.
    function mintClaims(
        address to,
        uint amount
    ) public onlyRole(CLAIM_MINTER_ROLE) {
        _mint(to, CLAIM_TOKEN_ID, amount, "");
    }

    // Redeem multiple claim tokens for photo nfts (n:n).
    function redeemClaims(
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

    // Lazy mint a new batch of unrevealed / future photos.
    // Use getMintRangeInput(uint numberOfTokens) to generate input.
    function mintPhotos(
        uint[] memory ids,
        uint[][] memory amounts,
        bytes32 checkSum
    ) public onlyRole(PHOTO_MINTER_ROLE) {
        _mintRange(ids, amounts, checkSum);
    }

    // ensures MintRangeInput get invalidated when initial supply changes
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

    // Update initial supply range [min, max] for future mints.
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

    // Returns initial supply range that was used for a tokenId.
    function initialSupply(uint tokenId) public view returns (uint[] memory) {
        // optimization for mintRange
        if (_initialSupplyRange[_initialSupplyRange.length - 1] <= tokenId) {
            return _initialSupplies[_initialSupplyRange.length - 1];
        }
        uint supplyIndex = Ph101ppDailyPhotoUtils.findLowerBound(
            _initialSupplyRange,
            tokenId
        );
        return _initialSupplies[supplyIndex];
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Initial Holders
    ///////////////////////////////////////////////////////////////////////////////

    // Update initial holder accounts for future mints.
    function setInitialHolders(
        address treasury,
        address vault
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        address[] memory addresses = new address[](2);
        addresses[0] = treasury;
        addresses[1] = vault;
        _setInitialHolders(addresses);
    }

    // Update initial holder accounts for existing mints.
    // This method allows unsold & never transfered & non-locked tokens
    // in the treasury & vault to be moved to new treasury & vault
    // wallets without having to transfer them through ERC1155.
    // This method doesnt affect ERC1155.balances, so tokens that
    // have been sold or transfered before can't ever be affected by this method.
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

    // Defensive coding: Lock initial holders up to tokenId
    // so they cant be updated via updateInitialHoldersRange.
    function setLockInitialHoldersUpTo(
        uint256 tokenId
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setLockInitialHoldersUpTo(tokenId);
    }

    // Defensive coding: Permanently disable updateInitialHoldersRange.
    function permanentlyDisableInitialHoldersRangeUpdate()
        public
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        isInitialHoldersRangeUpdatePermanentlyDisabled = true;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // ERC2981 Royalties
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
        return Ph101ppDailyPhotoUtils.tokenSlugFromTokenId(tokenId);
    }

    function tokenSlugFromDate(
        uint year,
        uint month,
        uint day
    ) public pure returns (string memory tokenSlug) {
        return Ph101ppDailyPhotoUtils.tokenSlugFromDate(year, month, day);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Opensea Operator Filterer
    ///////////////////////////////////////////////////////////////////////////////

    // Owner can be used to make updates (register / subscribe)
    // to the OperatorFilterRegistry on behalf of this contract.
    function owner() public view override returns (address) {
        return _owner;
    }

    // Set new owner. This address will be returned by owner().
    function setOwner(
        address newOwner
    ) public whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) {
        _owner = newOwner;
    }

    // Update address to OperatorFilterRegistry contract.
    // Set to address(0) to disable registry checks.
    function setOperatorFilterRegistry(
        address _operatorFilterRegistry
    ) public whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) {
        _setOperatorFilterRegistry(_operatorFilterRegistry);
    }

    // Defensive Coding: Permanently freeze operator filter registry address
    function permanentlyFreezeOperatorFilterRegistry()
        public
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _permanentlyFreezeOperatorFilterRegistry();
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Transfer Event Listener
    ///////////////////////////////////////////////////////////////////////////////

    function setTransferEventListenerAddress(
        address listener
    ) public whenNotPaused onlyRole(DEFAULT_ADMIN_ROLE) {
        // require(!isTransferEventListenerAddressPermanentlyFrozen);
        transferEventListenerAddress = listener;
    }

    // function permanentlyFreezeTransferEventListenerAddress()
    //     public
    //     whenNotPaused
    //     onlyRole(DEFAULT_ADMIN_ROLE)
    // {
    //     isTransferEventListenerAddressPermanentlyFrozen = true;
    // }

    function _afterTokenTransfer(
        address operator,
        address from,
        address to,
        uint[] memory ids,
        uint[] memory amounts,
        bytes memory data
    ) internal virtual override {
        if (transferEventListenerAddress != address(0)) {
            IPh101ppDailyPhotoListener(transferEventListenerAddress)
                .Ph101ppDailyPhotoTransferHandler(
                    operator,
                    from,
                    to,
                    ids,
                    amounts,
                    data
                );
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Transfer & Approval modifiers for Opensea Operator Filterer
    ///////////////////////////////////////////////////////////////////////////////

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

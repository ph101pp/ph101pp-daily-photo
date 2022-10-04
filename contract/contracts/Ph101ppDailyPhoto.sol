// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155MintRange.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "./Ph101ppDailyPhotoTokenId.sol";

// import "hardhat/console.sol";

contract Ph101ppDailyPhoto is ERC1155MintRange, ERC2981, AccessControl {
    bytes32 public constant URI_UPDATER_ROLE = keccak256("URI_UPDATER_ROLE");
    bytes32 public constant CLAIM_MINTER_ROLE = keccak256("CLAIM_MINTER_ROLE");
    bytes32 public constant PHOTO_MINTER_ROLE = keccak256("PHOTO_MINTER_ROLE");
    string private constant FUTURE_TOKEN = "FUTURE";
    string private constant CLAIM_TOKEN = "CLAIM";
    uint256 private constant CLAIM_TOKEN_ID = 0;

    uint256 private constant TREASURY_ID = 0;
    uint256 private constant VAULT_ID = 1;

    string[] private _permanentUris;
    string private _proxyUri;
    uint256 private _lastPermanentUriValidUptoTokenId;

    uint256[] private _maxSupplies;
    uint256[] private _maxSupplyRange;

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

        setProxyURI(newProxyUri);
        setPermanentURI(newPermanentUri, 0);
        setInitialHolders(treasuryAddress, vaultAddress);
        setDefaultRoyalty(msg.sender, 500);
        _mint(treasuryAddress, 0, 10, "");
    }

    function initialBalanceOf(address account, uint256 tokenId)
        public
        view
        override
        returns (uint256)
    {
        address[] memory addresses = initialHolders(tokenId);
        if (account == addresses[TREASURY_ID]) {
            // before any mintRange happened
            if (_maxSupplyRange.length <= 0) {
                return 0;
            }
            uint256 supplyIndex = _findInRange(_maxSupplyRange, tokenId);
            uint256 maxSupply = _maxSupplies[supplyIndex];
            uint256 supply = (uint256(
                keccak256(abi.encode(tokenId, maxSupply))
            ) % maxSupply) + 1;

            return supply;
        }

        if (account == addresses[VAULT_ID]) {
            return 1;
        }

        return 0;
    }

    function setInitialHolders(address treasury, address vault)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        address[] memory addresses = new address[](2);
        addresses[0] = treasury;
        addresses[1] = vault;
        _setInitialHolders(addresses);
    }

    function updateInitialHoldersRange(
        address[] memory fromAddresses,
        address[] memory toAddresses,
        uint256[][] memory ids,
        uint256[][] memory amounts,
        address[][] memory newInitialHolders,
        uint256[] memory newInitialHoldersRange,
        bytes32 inputChecksum
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
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

    function setPermanentURI(string memory newUri, uint256 validUptoTokenId)
        public
        onlyRole(URI_UPDATER_ROLE)
    {
        require(
            validUptoTokenId > _lastPermanentUriValidUptoTokenId || _permanentUris.length == 0,
            "Error: URI must be valid for more tokenIds than previous URI."
        );
        _permanentUris.push(newUri);
        _lastPermanentUriValidUptoTokenId = validUptoTokenId;
    }

    function setProxyURI(string memory newProxyUri)
        public
        onlyRole(URI_UPDATER_ROLE)
    {
        _proxyUri = newProxyUri;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenDate;
        string memory currentUri;
        // token...
        if (tokenId == CLAIM_TOKEN_ID) {
            // ... is claim -> return claim
            tokenDate = CLAIM_TOKEN;
            currentUri = permanentBaseUri();
        } else {
            (
                uint256 year,
                uint256 month,
                uint256 day
            ) = Ph101ppDailyPhotoTokenId.tokenIdToDate(tokenId);

            tokenDate = string.concat(
                Strings.toString(year),
                month <= 9 ? "0" : "",
                Strings.toString(month),
                day <= 9 ? "0" : "",
                Strings.toString(day)
            );

            if (
                exists(tokenId) && _lastPermanentUriValidUptoTokenId >= tokenId
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

    function tokenIdToDate(uint256 tokenId)
        public
        pure
        returns (
            uint256 year,
            uint256 month,
            uint256 day
        )
    {
        return Ph101ppDailyPhotoTokenId.tokenIdToDate(tokenId);
    }

    function tokenIdFromDate(
        uint256 year,
        uint256 month,
        uint256 day
    ) public pure returns (uint256 tokenId) {
        return Ph101ppDailyPhotoTokenId.tokenIdFromDate(year, month, day);
    }

    function redeemClaims(uint256[] memory tokenIds, uint256[] memory amounts)
        public
    {
        uint256 claimsRequired = 0;
        for (uint i = 0; i < amounts.length; i++) {
            claimsRequired += amounts[i];
        }
        _burn(msg.sender, 0, claimsRequired);
        address[] memory initialHolders = initialHolders(tokenIds[0]);
        _safeBatchTransferFrom(
            initialHolders[TREASURY_ID],
            msg.sender,
            tokenIds,
            amounts,
            ""
        );
    }

    function mintClaims(address to, uint256 amount)
        public
        onlyRole(CLAIM_MINTER_ROLE)
    {
        _mint(to, 0, amount, "");
    }

    function mintPhotos(
        uint256[] memory ids,
        uint256[][] memory amounts,
        bytes32 checkSum,
        uint256 maxSupply
    ) public onlyRole(PHOTO_MINTER_ROLE) {
        _maxSupplyRange.push(ids[0]);
        _maxSupplies.push(maxSupply);

        _mintRange(ids, amounts, checkSum);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function resetTokenRoyalty(uint256 tokenId)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _resetTokenRoyalty(tokenId);
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

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

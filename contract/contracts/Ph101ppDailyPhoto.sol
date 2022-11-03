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
    uint256 public constant START_DATE = 1661990400; // Sept 1, 2022
    bytes32 public constant URI_UPDATER_ROLE = keccak256("URI_UPDATER_ROLE");
    bytes32 public constant CLAIM_MINTER_ROLE = keccak256("CLAIM_MINTER_ROLE");
    bytes32 public constant PHOTO_MINTER_ROLE = keccak256("PHOTO_MINTER_ROLE");
    uint256 public constant CLAIM_TOKEN_ID = 0;
    string private constant CLAIM_TOKEN = "CLAIM";

    uint256 private constant TREASURY_ID = 0;
    uint256 private constant VAULT_ID = 1;

    string[] private _permanentUris;
    string private _proxyUri;
    uint256 private _lastPermanentUriValidUpToTokenId;

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
        mintClaims(treasuryAddress, 10);
    }

    function initialBalanceOf(address account, uint256 tokenId)
        public
        view
        override
        returns (uint256)
    {
        address[] memory addresses = initialHolders(tokenId);
        if (account == addresses[TREASURY_ID]) {
            // before max supply is set
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

    function setPermanentURI(string memory newUri, uint256 validUpToTokenId)
        public
        onlyRole(URI_UPDATER_ROLE)
    {
        require(
            validUpToTokenId > _lastPermanentUriValidUpToTokenId ||
                _permanentUris.length == 0,
            "Error: URI must be valid for more tokenIds than previous URI."
        );
        _permanentUris.push(newUri);
        _lastPermanentUriValidUpToTokenId = validUpToTokenId;
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
            currentUri = proxyBaseUri();
        } else {
            (uint256 year, uint256 month, uint256 day) = tokenIdToDate(tokenId);

            tokenDate = string.concat(
                Strings.toString(year),
                month <= 9 ? "0" : "",
                Strings.toString(month),
                day <= 9 ? "0" : "",
                Strings.toString(day)
            );

            if (
                exists(tokenId) && _lastPermanentUriValidUpToTokenId >= tokenId
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
        require(tokenId > 0, "No date associated with claims!"); // No date associated with claims!
        uint256 tokenTimestamp = _timestampFromTokenId(tokenId);
        return _timestampToDate(tokenTimestamp);
    }

    function tokenIdFromDate(
        uint256 year,
        uint256 month,
        uint256 day
    ) public pure returns (uint256 tokenId) {
        require(DateTime.isValidDate(year, month, day), "Invalid date!");
        uint256 tokenTimestamp = DateTime.timestampFromDate(year, month, day);
        require(
            tokenTimestamp >= START_DATE,
            "Invalid date! Project started September 1, 2022!"
        );
        return _timestampToTokenId(tokenTimestamp);
    }

    function redeemClaim(uint256 tokenId) public {
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
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) public {
        uint256 claimsRequired = amounts[0];
        address[] memory initialHolders0 = initialHolders(tokenIds[0]);
        for (uint i = 1; i < amounts.length; i++) {
            claimsRequired += amounts[i];
            require(initialHolders0[TREASURY_ID] == initialHolders(tokenIds[i])[TREASURY_ID], "Can't batch claim tokens from multiple treasury wallets.");
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

    function mintClaims(address to, uint256 amount)
        public
        onlyRole(CLAIM_MINTER_ROLE)
    {
        _mint(to, CLAIM_TOKEN_ID, amount, "");
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

    function _timestampToDate(uint256 timestamp)
        private
        pure
        returns (
            uint256 year,
            uint256 month,
            uint256 day
        )
    {
        return DateTime.timestampToDate(timestamp);
    }

    function _timestampFromTokenId(uint256 tokenId)
        private
        pure
        returns (uint256 timestamp)
    {
        return START_DATE + ((tokenId - 1) * 1 days);
    }

    function _timestampToTokenId(uint256 timestamp)
        private
        pure
        returns (uint256 tokenId)
    {
        return ((timestamp - START_DATE) / 1 days) + 1;
    }
}

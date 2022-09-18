// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155DynamicInitialBalances.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Ph101ppDailyPhotosTokenId.sol";

// import "hardhat/console.sol";

contract Ph101ppDailyPhotos is ERC1155DynamicInitialBalances, AccessControl {
    bytes32 public constant CLAIM_MINTER_ROLE = keccak256("CLAIM_MINTER_ROLE");
    bytes32 public constant PHOTO_MINTER_ROLE = keccak256("PHOTO_MINTER_ROLE");
    string private constant FUTURE_TOKEN = "FUTURE";
    string private constant CLAIM_TOKEN = "CLAIM";
    uint256 private constant CLAIM_TOKEN_ID = 0;

    string private _uri;
    string private _mutableUri;
    uint256 private _lastUriUpdate;

    uint256[] private _maxSupplies;
    uint256[] private _maxSupplyRange;

    event UriSet(string newURI, address sender);

    constructor(
        string memory newUri,
        string memory newMutableUri,
        address[] memory initialHolders
    ) ERC1155_("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CLAIM_MINTER_ROLE, msg.sender);
        _grantRole(PHOTO_MINTER_ROLE, msg.sender);

        setURI(newUri);
        setMutableURI(newMutableUri);
        _setInitialHolders(initialHolders);
        (
            address[] memory claimAddresses,
            uint256[] memory claimIds,
            uint256[][] memory claimAmounts
        ) = getMintRangeInput(1);
        _mintRange(claimAddresses, claimIds, claimAmounts);
    }

    function initialBalanceOf(address, uint256 tokenId)
        public
        view
        override
        returns (uint256)
    {
        // uint256[] memory initialBalances = new uint256[](1);
        // uint maxSupplyIndex = _findInRange(_maxSupplyRange, tokenId);

        // if (tokenId == 0) {
        //     initialBalances[0] = 10;
        //     // initialBalances[VAULT_ADDRESS_ID] = 0;
        // } else {
        //     initialBalances[0] = _maxSupplies[maxSupplyIndex];
        //     // initialBalances[VAULT_ADDRESS_ID] = 1;
        // }
        return 0;
    }

    function setURI(string memory newUri) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _uri = newUri;
        _lastUriUpdate = block.timestamp;
        emit UriSet(newUri, msg.sender);
    }

    function setMutableURI(string memory newMutableUri)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _mutableUri = newMutableUri;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenDate;
        string memory currentUri;

        // token...
        if (tokenId == CLAIM_TOKEN_ID) {
            // ... is claim -> return claim
            tokenDate = CLAIM_TOKEN;
            currentUri = _uri;
        } else {
            uint256 tokenTimestamp = Ph101ppDailyPhotosTokenId
                ._timestampFromTokenId(tokenId);

            if (block.timestamp < tokenTimestamp) {
                // ... in future -> return default.
                tokenDate = FUTURE_TOKEN;
                currentUri = _uri;
            } else {
                (
                    uint256 year,
                    uint256 month,
                    uint256 day
                ) = Ph101ppDailyPhotosTokenId._timestampToDate(tokenTimestamp);

                tokenDate = string.concat(
                    Strings.toString(year),
                    month <= 9 ? "0" : "",
                    Strings.toString(month),
                    day <= 9 ? "0" : "",
                    Strings.toString(day)
                );

								if (_lastUriUpdate > tokenTimestamp) {
                    // ... uri updated since token -> immutable uri
                    currentUri = _uri;
                } else {
                    // ... uri not yet updated since token -> mutable uri
                    currentUri = _mutableUri;
                }
            }
        }

        return string.concat(currentUri, tokenDate, ".json");
    }

    function mutableBaseUri() public view returns (string memory) {
        return _mutableUri;
    }

    function baseUri() public view returns (string memory) {
        return _uri;
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
        return Ph101ppDailyPhotosTokenId.tokenIdToDate(tokenId);
    }

    function tokenIdFromDate(
        uint256 year,
        uint256 month,
        uint256 day
    ) public pure returns (uint256 tokenId) {
        return Ph101ppDailyPhotosTokenId.tokenIdFromDate(year, month, day);
    }

    function mintClaim(address to, uint256 amount)
        public
        onlyRole(CLAIM_MINTER_ROLE)
    {
        _mint(to, 0, amount, "");
    }

    function mintPhotos(
        address[] memory addresses,
        uint256[] memory ids,
        uint256[][] memory amounts,
        uint256 maxSupply
    ) public onlyRole(PHOTO_MINTER_ROLE) {
        _maxSupplyRange.push(ids[0]);
        _maxSupplies.push(maxSupply);

        _mintRange(addresses, ids, amounts);
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, ERC1155_)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

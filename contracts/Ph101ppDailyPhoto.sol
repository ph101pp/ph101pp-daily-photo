// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./DateTime.sol";

contract Ph101ppDailyPhotos is ERC1155, AccessControl, ERC1155Supply {
    // bytes32 public constant PHOTO_MINTER = keccak256("PHOTO_MINTER");
    uint256 public constant START_DATE = 1661990400; // Sept 1, 2022
    string private constant FUTURE_TOKEN = "FUTURE";
    string private constant CLAIM_TOKEN = "CLAIM";
    uint256 private constant CLAIM_TOKEN_ID = 0;

    string[] private _uris;
    string private _mutableUri;
    uint256 private _lastUriUpdate;

    constructor(string memory newUri, string memory newMutableUri) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        setURI(newUri);
        setMutableURI(newMutableUri);
    }

    function setURI(string memory newUri) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _lastUriUpdate = block.timestamp;
        _uris.push(newUri);
    }

    function setMutableURI(string memory newMutableUri)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _mutableUri = newMutableUri;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory latestURI = _uris[_uris.length - 1];
        string memory tokenDate;
        string memory currentUri;

        // token...
        if (tokenId == CLAIM_TOKEN_ID) {
            // ... is claim -> return claim
            tokenDate = CLAIM_TOKEN;
            currentUri = latestURI;
        } else {
            uint256 tokenTimestamp = _timestampFromTokenId(tokenId);
            uint256 todayToken = _timestampToTokenId(block.timestamp);

            if (block.timestamp < tokenTimestamp) {
                // ... in future -> return default.
                tokenDate = FUTURE_TOKEN;
                currentUri = latestURI;
            } else if (tokenId == todayToken) {
                // ... is today -> return mutable uri
                tokenDate = _timestampToDate(tokenTimestamp);
                currentUri = _mutableUri;
            } else {
                // ... in past ...
                tokenDate = _timestampToDate(tokenTimestamp);

                // ... and ...
                if (_lastUriUpdate > tokenTimestamp) {
                    // ... uri updated since token -> immutable uri
                    currentUri = latestURI;
                } else {
                    // ... uri not yet updated since token -> mutable uri
                    currentUri = _mutableUri;
                }
            }
        }

        return string.concat(currentUri, tokenDate, ".json");
    }

    function uriForDate(
        uint256 year,
        uint256 month,
        uint256 day
    ) public view returns (string memory) {
        uint256 tokenID = tokenIdFromDate(year, month, day);
        return uri(tokenID);
    }

    function uriHistory() public view returns (string[] memory) {
        return _uris;
    }

    function mutableUri() public view returns (string memory) {
        return _mutableUri;
    }

    function tokenIdToDate(uint256 tokenId)
        public
        pure
        returns (string memory date)
    {
        require(tokenId > CLAIM_TOKEN_ID, "No date associated with claims!");
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
        require(tokenTimestamp >= START_DATE, "Project started September 1, 2022!");
        return _timestampToTokenId(tokenTimestamp);
    }

    // returns date as string(yyyymmdd)
    function _timestampToDate(uint256 timestamp)
        private
        pure
        returns (string memory date)
    {
        (uint256 year, uint256 month, uint256 day) = DateTime.timestampToDate(
            timestamp
        );
        return
            string.concat(
                Strings.toString(year),
                month <= 9 ? "0" : "",
                Strings.toString(month),
                day <= 9 ? "0" : "",
                Strings.toString(day)
            );
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

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _mintBatch(to, ids, amounts, data);
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

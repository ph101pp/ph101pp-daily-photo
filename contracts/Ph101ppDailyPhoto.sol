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
  uint256 private constant MAX_DATE = 99999999999; // Nov 16, 5138
  uint256 private constant MAX_YEAR = 5138;
  string private constant DEFAULT_TOKEN_DATE = "99999999";

  string[] private _uris;
  string private _mutableUri;
  uint256 private _lastUriUpdate;

  constructor() ERC1155("") {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function setURI(string memory newUri) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _lastUriUpdate = block.timestamp;
    _uris.push(newUri);
  }

  function setMutualURI(string memory newMutableUri) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _mutableUri = newMutableUri;
  }

  function uri(uint256 tokenId) public view override returns (string memory) {
    uint256 tokenTimestamp = _tokenId2Timestamp(tokenId);
    uint256 todayToken = _timestamp2TokenId(block.timestamp);
    string memory latestURI = _uris[_uris.length - 1];

    string memory tokenDate;
    string memory currentUri;

    // token...
    if (block.timestamp < tokenTimestamp) {
      // ... in future -> return default.
      tokenDate = DEFAULT_TOKEN_DATE;
      currentUri = latestURI;
    } else if (tokenId == todayToken) {
      // ... today -> return mutable uri
      tokenDate = _timestamp2Date(tokenTimestamp);
      currentUri = _mutableUri;
    } else {
      // ... in past ...
      tokenDate = _timestamp2Date(tokenTimestamp);

      // ... and ...
      if (_lastUriUpdate > tokenTimestamp) {
        // ... uri updated since token -> immutable uri
        currentUri = latestURI;
      } else {
        // ... uri not yet updated since token -> mutable uri
        currentUri = _mutableUri;
      }
    }
    return string.concat(currentUri, tokenDate);
  }

  function uriHistory() public view returns (string[] memory) {
    return _uris;
  }

  function tokenIdToDate(uint256 tokenId)
    public
    pure
    returns (string memory date)
  {
    uint256 tokenTimestamp = _tokenId2Timestamp(tokenId);
    return _timestamp2Date(tokenTimestamp);
  }

  function tokenIdFromDate(
    uint256 year,
    uint256 month,
    uint256 day
  ) public pure returns (uint256 tokenId) {
    require(year < MAX_YEAR);
    require(month <= 12);
    require(day <= 31);
    uint256 tokenTimestamp = DateTime.timestampFromDate(year, month, day);
    return _timestamp2TokenId(tokenTimestamp);
  }

  // returns date as string(yyyymmdd)
  function _timestamp2Date(uint256 timestamp)
    private
    pure
    returns (string memory date)
  {
    require(timestamp < MAX_DATE);
    (uint256 year, uint256 month, uint256 day) = DateTime.timestampToDate(
      timestamp
    );
    return
      string.concat(
        Strings.toString(year),
        month <= 9 ? "0":"",
        Strings.toString(month),
        day <= 9 ? "0":"",
        Strings.toString(day)
      );
  }

  function _tokenId2Timestamp(uint256 tokenId)
    private
    pure
    returns (uint256 timestamp)
  {
    return START_DATE + (tokenId * 1 days);
  }

  function _timestamp2TokenId(uint256 timestamp)
    private
    pure
    returns (uint256 tokenId)
  {
    return (timestamp - START_DATE) / 1 days;
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

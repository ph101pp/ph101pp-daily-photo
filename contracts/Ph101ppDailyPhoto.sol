// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155DynamicInitialBalances.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./DateTime.sol";

// import "hardhat/console.sol";


contract Ph101ppDailyPhotos is ERC1155DynamicInitialBalances, AccessControl {
	bytes32 public constant CLAIM_MINTER_ROLE = keccak256("CLAIM_MINTER_ROLE");
	bytes32 public constant PHOTO_MINTER_ROLE = keccak256("PHOTO_MINTER_ROLE");
	uint256 public constant START_DATE = 1661990400; // Sept 1, 2022
	string private constant FUTURE_TOKEN = "FUTURE";
	string private constant CLAIM_TOKEN = "CLAIM";
	uint256 private constant CLAIM_TOKEN_ID = 0;

	string private _uri;
	string private _mutableUri;
	uint256 private _lastUriUpdate;
	address private _vaultAddresses;
	address private _treasuryAddress;
	uint256 private _lastTokenId = 0;

	uint256[] private _maxSupplies;
	uint256[] private _maxSupplyRange;

	event UriSet(string newURI, address sender);

	uint private constant TREASURY_ADDRESS_ID = 0;
	uint private constant VAULT_ADDRESS_ID = 1;
	address[] private _initialHolderAddresses = new address[](1);

	constructor(
	  string memory newUri, 
	  string memory newMutableUri,
	  address treasuryAddress,
	  address vaultAddress
	) ERC1155_("") {
		_grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_grantRole(CLAIM_MINTER_ROLE, msg.sender);
		_grantRole(PHOTO_MINTER_ROLE, msg.sender);

		_initialHolderAddresses[TREASURY_ADDRESS_ID]=treasuryAddress;
		// _initialHolderAddresses[VAULT_ADDRESS_ID]=vaultAddress;
		setURI(newUri);
		setMutableURI(newMutableUri);
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
		uint256[] memory initialBalances = new uint256[](1);
		uint maxSupplyIndex = _findInRange(_maxSupplyRange, tokenId);

		if(tokenId == 0) {
			initialBalances[TREASURY_ADDRESS_ID] = 10;
			// initialBalances[VAULT_ADDRESS_ID] = 0;
		}
		else {
			initialBalances[TREASURY_ADDRESS_ID] = _maxSupplies[maxSupplyIndex];
			// initialBalances[VAULT_ADDRESS_ID] = 1;
		}
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
			uint256 tokenTimestamp = _timestampFromTokenId(tokenId);
			uint256 todayToken = _timestampToTokenId(block.timestamp);
			if (block.timestamp < tokenTimestamp) {
				// ... in future -> return default.
				tokenDate = FUTURE_TOKEN;
				currentUri = _uri;
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

	function lastTokenId() public view returns (uint256) {
		return _lastTokenId;
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

	function mintClaim(
		address to,
		uint256 amount
	) public onlyRole(CLAIM_MINTER_ROLE) {
		_mint(to, 0, amount, "");
	}

	function mintPhotos(
		uint256[] memory ids,
		uint256[][] memory amounts,
		uint256 maxSupply
	) public onlyRole(PHOTO_MINTER_ROLE) {
		_maxSupplyRange.push(ids[0]);
		_maxSupplies.push(maxSupply);

		address[] memory addresses = initialHolders();

		_safeMintRange(addresses, ids, amounts);
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

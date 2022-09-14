// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ----------------------------------------------------------------------------
// DateTime Library v2.0 - Contract Instance
//
// A gas-efficient Solidity date and time library
//
// https://github.com/bokkypoobah/DateTime
//
// Tested date range 1970/01/01 to 2345/12/31
//
// Conventions:
// Unit      | Range         | Notes
// :-------- |:-------------:|:-----
// timestamp | >= 0          | Unix timestamp, number of seconds since 1970/01/01 00:00:00 UTC
// year      | 1970 ... 2345 |
// month     | 1 ... 12      |
// day       | 1 ... 31      |
// hour      | 0 ... 23      |
// minute    | 0 ... 59      |
// second    | 0 ... 59      |
// dayOfWeek | 1 ... 7       | 1 = Monday, ..., 7 = Sunday
//
//
// Enjoy. (c) BokkyPooBah / Bok Consulting Pty Ltd 2018.
//
// GNU Lesser General Public License 3.0
// https://www.gnu.org/licenses/lgpl-3.0.en.html
// ----------------------------------------------------------------------------

import "./DateTime.sol";

contract DateTimeTestContract {
	uint256 public constant SECONDS_PER_DAY = 24 * 60 * 60;
	int256 public constant OFFSET19700101 = 2440588;

	function _now() public view returns (uint256 timestamp) {
		timestamp = block.timestamp;
	}

	function _nowDate()
		public
		view
		returns (
			uint256 year,
			uint256 month,
			uint256 day
		)
	{
		(year, month, day) = DateTime.timestampToDate(block.timestamp);
	}

	function _daysFromDate(
		uint256 year,
		uint256 month,
		uint256 day
	) public pure returns (uint256 _days) {
		return DateTime._daysFromDate(year, month, day);
	}

	function _daysToDate(uint256 _days)
		public
		pure
		returns (
			uint256 year,
			uint256 month,
			uint256 day
		)
	{
		return DateTime._daysToDate(_days);
	}

	function timestampFromDate(
		uint256 year,
		uint256 month,
		uint256 day
	) public pure returns (uint256 timestamp) {
		return DateTime.timestampFromDate(year, month, day);
	}

	function timestampToDate(uint256 timestamp)
		public
		pure
		returns (
			uint256 year,
			uint256 month,
			uint256 day
		)
	{
		(year, month, day) = DateTime.timestampToDate(timestamp);
	}
}

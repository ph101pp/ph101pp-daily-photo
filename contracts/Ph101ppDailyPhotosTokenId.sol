// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./DateTime.sol";

library Ph101ppDailyPhotosTokenId {
    uint256 public constant START_DATE = 1661990400; // Sept 1, 2022

    function tokenIdToDate(uint256 tokenId)
        public
        pure
        returns (
            uint256 year,
            uint256 month,
            uint256 day
        )
    {
        require(tokenId > 0, "No date associated with claims!");
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
            "Project started September 1, 2022!"
        );
        return _timestampToTokenId(tokenTimestamp);
    }

    // returns date as string(yyyymmdd)
    function _timestampToDate(uint256 timestamp)
        public
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
        public
        pure
        returns (uint256 timestamp)
    {
        return START_DATE + ((tokenId - 1) * 1 days);
    }

    function _timestampToTokenId(uint256 timestamp)
        public
        pure
        returns (uint256 tokenId)
    {
        return ((timestamp - START_DATE) / 1 days) + 1;
    }
}

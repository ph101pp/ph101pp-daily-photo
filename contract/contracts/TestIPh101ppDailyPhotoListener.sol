// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./IPh101ppDailyPhotoListener.sol";
import "./Ph101ppDailyPhoto.sol";

import "hardhat/console.sol";

contract TestIPh101ppDailyPhotoListener is IPh101ppDailyPhotoListener {
    event Ph101ppDailyPhotoTransferReceived(
        address sender,
        address operator,
        address from,
        address to,
        uint[] ids,
        uint[] amounts,
        bytes data
    );

    Ph101ppDailyPhoto private pdp;

    constructor(address PDPaddress) {
        pdp = Ph101ppDailyPhoto(PDPaddress);
    }

    function Ph101ppDailyPhotoTransferHandler(
        address operator,
        address from,
        address to,
        uint[] memory ids,
        uint[] memory amounts,
        bytes memory data
    ) external {
        if(to == from) {
            revert("Test Revert");
        }

        emit Ph101ppDailyPhotoTransferReceived(
            msg.sender,
            operator,
            from,
            to,
            ids,
            amounts,
            data
        );
    }
}

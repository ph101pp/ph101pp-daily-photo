// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IOperatorFilterRegistry} from "operator-filter-registry/src/IOperatorFilterRegistry.sol";

/**
 * @title  OpenseaOperatorFilterer
 * @dev    This smart contract is meant to be inherited by token contracts so they can use the following:
 *         - `onlyAllowedOperator` modifier for `transferFrom` and `safeTransferFrom` methods.
 *         - `onlyAllowedOperatorApproval` modifier for `approve` and `setApprovalForAll` methods.
 *         - `_setOperatorFilterRegistry to update the registry contract to check against
 *         - `_setIsOperatorFilterDisabled` to enable/disable registry checks
 *         - `_registerToOpenseaOperatorFilterRegistry` to register a contract to openseas registry.
 */
abstract contract OpenseaOperatorFilterer {
    error OperatorNotAllowed(address operator);

    bool public isOperatorFilterDisabled;
    bool public isOperatorFilterPermanentlyDisabled;

    // Default: OpenSea OperatorFilterRegistry contract
    address public operatorFilterRegistry =
        0x000000000000AAeB6D7670E522A718067333cd4E;
    // OpenSea Curated Subscription Address
    address constant openseaSubscriptionAddress =
        0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6;

    // required as authority to make updates to OperatorFilterRegistry for this contract.
    function owner() public virtual returns (address);

    // Register contract with OperatorFilterRegistry 
    // and copy / subscribe to OpenSea Curated Subscription 
    // Currently (Nov 22) this makes sense for mostly everyone.
    function _registerToOpenseaOperatorFilterRegistry(bool subscribe)
        internal
        virtual
    {
        if (subscribe) {
            IOperatorFilterRegistry(operatorFilterRegistry)
                .registerAndSubscribe(
                    address(this),
                    openseaSubscriptionAddress
                );
        } else {
            IOperatorFilterRegistry(operatorFilterRegistry)
                .registerAndCopyEntries(
                    address(this),
                    openseaSubscriptionAddress
                );
        }
    }

    // Enables updating registry contract address
    function _setOperatorFilterRegistry(address _operatorFilterRegistry)
        internal
        virtual
    {
        operatorFilterRegistry = _operatorFilterRegistry;
    }

    function _setIsOperatorFilterDisabled(bool _isOperatorFilterDisabled)
        internal
        virtual
    {
        require(!isOperatorFilterPermanentlyDisabled, "Operator filter permanently disabled");
        isOperatorFilterDisabled = _isOperatorFilterDisabled;
    }

    function _disabledOperatorFilterPermanently()
        internal
        virtual
    {
        isOperatorFilterPermanentlyDisabled = true;
        isOperatorFilterDisabled = true;
    }

    modifier onlyAllowedOperator(address from) virtual {
        // Check registry code length to facilitate testing in environments without a deployed registry.
        if (
            !isOperatorFilterDisabled  // && operatorFilterRegistry.code.length > 0
        ) {
            // Allow spending tokens from addresses with balance
            // Note that this still allows listings and marketplaces with escrow to transfer tokens if transferred
            // from an EOA.
            if (from == operator) {
                _;
                return;
            }
            if (
                !IOperatorFilterRegistry(operatorFilterRegistry)
                    .isOperatorAllowed(address(this), operator)
            ) {
                revert OperatorNotAllowed(operator);
            }
        }
        _;
    }

    modifier onlyAllowedOperatorApproval(address operator) virtual {
        // Check registry code length to facilitate testing in environments without a deployed registry.
        if (
            !isOperatorFilterDisabled  // && operatorFilterRegistry.code.length > 0
        ) {
            if (
                !IOperatorFilterRegistry(operatorFilterRegistry)
                    .isOperatorAllowed(address(this), operator)
            ) {
                revert OperatorNotAllowed(operator);
            }
        }
        _;
    }
}

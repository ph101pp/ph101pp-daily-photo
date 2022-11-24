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
 *         - `_permanentlyDisableOperatorFilter` to permanently disable registry checks
 *         - `_registerToOpenseaOperatorFilterRegistry` to register a contract to openseas registry.
 */
abstract contract OpenseaOperatorFilterer {
    error OperatorNotAllowed(address operator);

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
    // (requires manual registering / unregistring with Registry)
    function _setOperatorFilterRegistry(address _operatorFilterRegistry)
        internal
        virtual
    {
        require(!isOperatorFilterPermanentlyDisabled, "Permanently disabled");
        operatorFilterRegistry = _operatorFilterRegistry;
    }

    function _permanentlyDisableOperatorFilter() internal virtual {
        isOperatorFilterPermanentlyDisabled = true;
        operatorFilterRegistry = address(0);
    }

    function _isOperatorAllowed(address operator) private view {
        // Check registry code length to facilitate testing in environments without a deployed registry.
        if (
            operatorFilterRegistry != address(0) && // && operatorFilterRegistry.code.length > 0
            !IOperatorFilterRegistry(operatorFilterRegistry).isOperatorAllowed(
                address(this),
                operator
            )
        ) {
            revert OperatorNotAllowed(operator);
        }
    }

    modifier onlyAllowedOperator(address from) virtual {
        // Allow spending tokens from addresses with balance
        // Note that this still allows listings and marketplaces with escrow to transfer tokens if transferred
        // from an EOA.
        if (from != msg.sender) {
            _isOperatorAllowed(msg.sender);
        }
        _;
    }

    modifier onlyAllowedOperatorApproval(address operator) virtual {
        _isOperatorAllowed(operator);
        _;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IOperatorFilterRegistry} from "./reference/operator-filter-registry-main/src/IOperatorFilterRegistry.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title  OperatorFilterer
 * @notice Abstract contract whose constructor automatically registers and optionally subscribes to or copies another
 *         registrant's entries in the OperatorFilterRegistry.
 * @dev    This smart contract is meant to be inherited by token contracts so they can use the following:
 *         - `onlyAllowedOperator` modifier for `transferFrom` and `safeTransferFrom` methods.
 *         - `onlyAllowedOperatorApproval` modifier for `approve` and `setApprovalForAll` methods.
 * @notice DisableableOperatorFilterer adds setDisableOperatorFilterer && isOperatorFilterDisabled
 */
abstract contract DisableableOperatorFilterer is AccessControl {
    error OperatorNotAllowed(address operator);

    bool public isOperatorFilterDisabled;
    // Default: OpenSea's OperatorFilterRegistry contract
    address public operatorFilterRegistry =
        0x000000000000AAeB6D7670E522A718067333cd4E;

    // constructor() {
    //     // Default: Subscribe to OpenSea Curated Subscription Address
    //     IOperatorFilterRegistry(operatorFilterRegistry).registerAndSubscribe(
    //         address(this),
    //         address(0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6)
    //     );
    // }
    constructor(address subscriptionOrRegistrantToCopy, bool subscribe) {
        // If an inheriting token contract is deployed to a network without the registry deployed, the modifier
        // will not revert, but the contract will need to be registered with the registry once it is deployed in
        // order for the modifier to filter addresses.
        if (operatorFilterRegistry.code.length > 0) {
            if (subscribe) {
                IOperatorFilterRegistry(operatorFilterRegistry)
                    .registerAndSubscribe(
                        address(this),
                        subscriptionOrRegistrantToCopy
                    );
            } else {
                if (subscriptionOrRegistrantToCopy != address(0)) {
                    IOperatorFilterRegistry(operatorFilterRegistry)
                        .registerAndCopyEntries(
                            address(this),
                            subscriptionOrRegistrantToCopy
                        );
                } else {
                    IOperatorFilterRegistry(operatorFilterRegistry).register(
                        address(this)
                    );
                }
            }
        }
    }

    function setOperatorFilterRegistry(address _operatorFilterRegistry)
        public
        virtual
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        operatorFilterRegistry = _operatorFilterRegistry;
    }

    function setIsOperatorFilterDisabled(bool _isOperatorFilterDisabled)
        public
        virtual
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        isOperatorFilterDisabled = _isOperatorFilterDisabled;
    }

    modifier onlyAllowedOperator(address from) virtual {
        // Check registry code length to facilitate testing in environments without a deployed registry.
        if (
            !isOperatorFilterDisabled && operatorFilterRegistry.code.length > 0
        ) {
            // Allow spending tokens from addresses with balance
            // Note that this still allows listings and marketplaces with escrow to transfer tokens if transferred
            // from an EOA.
            if (from == msg.sender) {
                _;
                return;
            }
            if (
                !IOperatorFilterRegistry(operatorFilterRegistry)
                    .isOperatorAllowed(address(this), msg.sender)
            ) {
                revert OperatorNotAllowed(msg.sender);
            }
        }
        _;
    }

    modifier onlyAllowedOperatorApproval(address operator) virtual {
        // Check registry code length to facilitate testing in environments without a deployed registry.
        if (
            !isOperatorFilterDisabled && operatorFilterRegistry.code.length > 0
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

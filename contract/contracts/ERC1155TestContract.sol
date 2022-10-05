// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155_.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

// import "hardhat/console.sol";

contract ERC1155MintRangeTestContract is
    ERC1155_,
    Pausable,
    ERC2981,
    AccessControl
{
    constructor() ERC1155_("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _mintBatch(to, ids, amounts, data);
    }

    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(from, id, amount);
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _burnBatch(from, ids, amounts);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function resetTokenRoyalty(uint256 tokenId)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _resetTokenRoyalty(tokenId);
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl, ERC1155_, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // @openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol
    mapping(uint256 => uint256) private _totalSupply;

    /**
     * @dev Total amount of tokens in with a given id.
     */
    function totalSupply(uint256 id) public view virtual returns (uint256) {
        return _totalSupply[id];
    }

    /**
     * @dev Indicates whether any token exist with a given id, or not.
     */
    function exists(uint256 id) public view virtual returns (bool) {
        return totalSupply(id) > 0;
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _totalSupply[ids[i]] += amounts[i];
            }
        }

        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                uint256 supply = _totalSupply[id];
                require(
                    supply >= amount,
                    "ERC1155: burn amount exceeds totalSupply"
                );
                unchecked {
                    _totalSupply[id] = supply - amount;
                }
            }
        }
    }
}

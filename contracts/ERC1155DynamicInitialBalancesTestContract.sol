// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./ERC1155DynamicInitialBalances.sol";

contract ERC1155DynamicInitialBalancesTestContract is
  ERC1155DynamicInitialBalances
{
  constructor() ERC1155_("") {}

  function initialBalanceOf(address, uint256 tokenId)
    public
    pure
    override
    returns (uint256)
  {
    // tokenId 0 -> everyone gets 99
    if(tokenId == 0) {
      return 9999;
    }
    // other tokens -> dynamic by token id
    else {
      return (tokenId % 10) + 1;
    }
  }

  function setInitialHolders(address[] memory addresses) public {
      _setInitialHolders(addresses);
  }

  function mintRange(
    address[] memory addresses,
    uint256[] memory ids,
    uint256[][] memory amounts
  ) public virtual {
    _safeMintRange(addresses, ids, amounts);
  }
 
  function mint(
    address to,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) public virtual {
    _mint(to, id, amount, data);
  }

  function mintBatch(
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) public virtual {
    _mintBatch(to, ids, amounts, data);
  }

  function burn(
      address from,
      uint256 id,
      uint256 amount
  ) public virtual {
    _burn(from, id, amount);
  }

  function burnBatch(
      address from,
      uint256[] memory ids,
      uint256[] memory amounts
  ) internal virtual {
    _burnBatch(from, ids, amounts);
  }
}

import { BigNumber } from "ethers";
import { TestERC1155MintRangeUpdateable, Ph101ppDailyPhoto, ERC1155MintRangeUpdateable } from "../typechain-types";

function findInRange(range: number[], needle: number) {
  for (let i = range.length - 1; i >= 0; i--) {
    if (needle >= range[i]) {
      return i;
    }
  }
  return 0;
}

export default async function _getUpdateInitialHolderRangesInputSafe(
  c: TestERC1155MintRangeUpdateable | Ph101ppDailyPhoto,

  newInitialHolders: string[][]
): Promise<[
  ERC1155MintRangeUpdateable.UpdateInitialHolderRangesInputStruct,
  string
]> {
  const [currentInitialHolders] = await c.initialHolderRanges();

  if (currentInitialHolders.length !== newInitialHolders.length) {
    throw Error("Error: newInitialHolders.length does not match");
  }
  for (let i = 0; i < currentInitialHolders.length; i++) {
    if (currentInitialHolders[i].length !== newInitialHolders[i].length) {
      throw Error("Error: newInitialHolders.length does not match");
    }
  }
  const input = await _getUpdateInitialHolderRangesInput(c, newInitialHolders);

  const checksum = await c.verifyUpdateInitialHolderRangesInput(input);
  return [
    input,
    checksum
  ]
}

export async function _getUpdateInitialHolderRangesInput(
  c: TestERC1155MintRangeUpdateable | Ph101ppDailyPhoto,
  newInitialHolders: string[][]
): Promise<ERC1155MintRangeUpdateable.UpdateInitialHolderRangesInputStruct> {
  const toAddresses: string[] = [];
  const fromAddresses: string[] = [];
  const ids: number[][] = [];
  const initialize: number[][] = [];
  const amounts: number[][] = [];
  const lastTokenId = await c.lastRangeTokenIdMinted();
  const [, currentInitialHoldersRangeBig] = await c.initialHolderRanges();
  const currentInitialHoldersRange = currentInitialHoldersRangeBig.map(n => n.toNumber());

  const from = 0;
  const too = lastTokenId.toNumber();

  const zeroMinted = await c.isZeroMinted();

  if (zeroMinted) {
    for (let i = from; i <= too; i++) {
      const currentInitialHolders = await c.initialHolders(i);
      const newHolderIndex = findInRange(currentInitialHoldersRange, i);
      const newHolders = newInitialHolders[newHolderIndex];

      const balances = await c.balanceOfBatch(currentInitialHolders, currentInitialHolders.map(() => i));
      const isManuallyMinted = await c.isManualMint(i);
      if (isManuallyMinted) {
        continue;
      }

      for (let a = 0; a < currentInitialHolders.length; a++) {
        const fromAddress = currentInitialHolders[a];
        const toAddress = newHolders[a];

        if (fromAddress === toAddress) {
          continue;
        }

        const balance = balances[a].toNumber();
        const isBalanceInitialized = await c.isBalanceInitialized(fromAddress, i)

        if ((balance > 0 || isBalanceInitialized)) {
          let addressIndex = fromAddresses.indexOf(fromAddress);
          if (addressIndex < 0) {
            fromAddresses.push(fromAddress);
            toAddresses.push(toAddress);
            addressIndex = fromAddresses.length - 1;

            initialize[addressIndex] = initialize[addressIndex] ?? [];
            ids[addressIndex] = ids[addressIndex] ?? [];
            amounts[addressIndex] = amounts[addressIndex] ?? [];
          }

          if (isBalanceInitialized) {
            initialize[addressIndex].push(i);
          }
          else if (balance > 0) {
            ids[addressIndex].push(i);
            amounts[addressIndex].push(balance);
          }
        }
      }
    }
  }
  
  const input: ERC1155MintRangeUpdateable.UpdateInitialHolderRangesInputStruct = {
    fromAddresses,
    toAddresses,
    ids,
    amounts,
    newInitialHolders,
  };

  return input;
}
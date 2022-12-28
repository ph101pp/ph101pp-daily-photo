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

export default async function _getUpdateInitialHoldersInputSafe(
  c: TestERC1155MintRangeUpdateable | Ph101ppDailyPhoto,
  newInitialHolders: string[][],
  newInitialHolderRanges: number[]
): Promise<[
  ERC1155MintRangeUpdateable.UpdateInitialHoldersInputStruct,
  string
]> {
  const input = await _getUpdateInitialHoldersInput(c, newInitialHolders, newInitialHolderRanges);
  const checksum = await c.verifyUpdateInitialHoldersInput(input);
  return [
    input,
    checksum
  ]
}

export async function _getUpdateInitialHoldersInput(
  c: TestERC1155MintRangeUpdateable | Ph101ppDailyPhoto,
  newInitialHolders: string[][],
  newInitialHolderRanges: number[]
): Promise<ERC1155MintRangeUpdateable.UpdateInitialHoldersInputStruct> {
  const toAddresses: string[] = [];
  const fromAddresses: string[] = [];
  const ids: number[][] = [];
  const amounts: number[][] = [];
  const lastTokenId = await c.lastRangeTokenIdMinted();
  // const [, currentInitialHoldersRangeBig] = await c.initialHolderRanges();
  // const currentInitialHoldersRange = currentInitialHoldersRangeBig.map(n => n.toNumber());

  const from = 0;
  const too = lastTokenId.toNumber();

  const zeroMinted = await c.isZeroMinted();

  if (zeroMinted) {
    for (let i = from; i <= too; i++) {
      const currentInitialHolders = await c.initialHolders(i);
      const newHolderIndex = findInRange(newInitialHolderRanges, i);
      const newHolders = newInitialHolders[newHolderIndex];

      const balancesOld = await c.balanceOfBatch(currentInitialHolders, currentInitialHolders.map(() => i));
      const balancesNew = await c.balanceOfBatch(newHolders, newHolders.map(() => i));
      const isManuallyMinted = await c.isManualMint(i);
      if (isManuallyMinted) {
        continue;
      }

      for (let a = 0; a < newHolders.length; a++) {
        const fromAddress = currentInitialHolders[a];
        const toAddress = newHolders[a];

        if (fromAddress === toAddress) {
          continue;
        }

        const balanceFrom = balancesOld[a].toNumber();
        const balanceTo = balancesNew[a].toNumber();
        const isBalanceInitializedFrom = await c.isBalanceInitialized(fromAddress, i)
        const isBalanceInitializedTo = await c.isBalanceInitialized(toAddress, i)
        const isInitialHolder = await c.isInitialHolderAddress(toAddress);

        if (
          !isBalanceInitializedFrom && ((balanceTo == 0 && !isInitialHolder) || (isInitialHolder && !isBalanceInitializedTo))
        ) {
          let addressIndex = fromAddresses.indexOf(fromAddress);

          if (addressIndex < 0) {
            fromAddresses.push(fromAddress);
            toAddresses.push(toAddress);
            addressIndex = fromAddresses.length - 1;

            ids[addressIndex] = ids[addressIndex] ?? [];
            amounts[addressIndex] = amounts[addressIndex] ?? [];
          }
          ids[addressIndex].push(i);
          amounts[addressIndex].push(balanceFrom);
        }
      }
    }
  }

  const input: ERC1155MintRangeUpdateable.UpdateInitialHoldersInputStruct = {
    fromAddresses,
    toAddresses,
    ids,
    amounts,
    newInitialHolders,
    newInitialHolderRanges
  };

  return input;
}
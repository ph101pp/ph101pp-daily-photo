import { ERC1155MintRangeTestContract } from "../typechain-types";
import { ethers } from "hardhat";

function findInRange(range: number[], needle: number) {
  for (let i = range.length - 1; i >= 0; i--) {
    if (needle >= range[i]) {
      return i;
    }
  }
  return 0;
}

export default async function getUpdateInitialHoldersRangeInput(
  c: ERC1155MintRangeTestContract,
  from: number,
  to: number,
  newInitialHolders: string[]
): Promise<[
  string[],
  string[],
  number[][],
  number[][],
  string[][],
  number[],
  string
]> {
  const toAddresses: string[] = [];
  const fromAddresses: string[] = [];
  const ids: number[][] = [];
  const amounts: number[][] = [];

  const too = to == Infinity ? await c._lastRangeTokenId() : to;

  for (let i = from; i <= too; i++) {
    const currentInitialHolders = await c["initialHolders(uint256)"](i);
    const balances = await c.balanceOfBatch(currentInitialHolders, currentInitialHolders.map(() => i));
    const isManuallyMinted = await c._manualMint(i);

    if (isManuallyMinted) {
      continue;
    }

    for (let a = 0; a < currentInitialHolders.length; a++) {
      const fromAddress = currentInitialHolders[a];
      const toAddress = newInitialHolders[a];
      const balance = balances[a].toNumber();
      const isBalanceInitialized = await c._balancesInitialized(i, fromAddress)

      if (!isBalanceInitialized && balance > 0) {
        let addressIndex = fromAddresses.indexOf(fromAddress);
        if (addressIndex < 0) {
          fromAddresses.push(fromAddress);
          toAddresses.push(toAddress);
          addressIndex = fromAddresses.length - 1;
        }
        ids[addressIndex] = ids[addressIndex] ?? [];
        ids[addressIndex].push(i);
        amounts[addressIndex] = amounts[addressIndex] ?? [];
        amounts[addressIndex].push(balance);
      }
    }
  }

  const newInitialHoldersArray: string[][] = [];
  const newInitialHoldersRange: number[] = [];

  const [currentInitialHolders, currentInitialHoldersRangeBig] = await c.initialHoldersRange();
  const currentInitialHoldersRange = currentInitialHoldersRangeBig.map(n => n.toNumber());
  const fromIndex = findInRange(currentInitialHoldersRange, from);
  const toIndex = findInRange(currentInitialHoldersRange, to);
  const skip = toIndex - fromIndex;
  let newRangeIndex = 0;
  let rangeSet = false;

  for (let i = 0; i < currentInitialHoldersRange.length; i++) {
    const current = currentInitialHoldersRange[i];

    if (current < from || current > to) {
      newInitialHoldersRange[newRangeIndex] = currentInitialHoldersRange[i];
      newInitialHoldersArray[newRangeIndex] = currentInitialHolders[i];
      newRangeIndex++;

    } else if (current >= from && current <= to) {
      newInitialHoldersRange[newRangeIndex] = from;
      newInitialHoldersArray[newRangeIndex] = newInitialHolders;
      rangeSet = true;
      if(to === Infinity) {
        break;
      }
      newInitialHoldersRange[newRangeIndex + 1] = to+1;
      newInitialHoldersArray[newRangeIndex + 1] = currentInitialHolders[toIndex];
      newRangeIndex += 2;
      i += skip;
    }
  }
  if (!rangeSet) {
    newInitialHoldersRange[newInitialHoldersRange.length - 2] = from;
    newInitialHoldersArray[newInitialHoldersRange.length - 2] = newInitialHolders;
    if (to !== Infinity) {
      newInitialHoldersRange[newInitialHoldersRange.length - 1] = to+1;
      newInitialHoldersArray[newInitialHoldersRange.length - 1] = currentInitialHolders[toIndex];
    }
  }

  const checksum = await c.getChecksum(
    fromAddresses,
    toAddresses,
    ids,
    amounts,
    newInitialHoldersArray,
    newInitialHoldersRange
  );

  return [
    fromAddresses,
    toAddresses,
    ids,
    amounts,
    newInitialHoldersArray,
    newInitialHoldersRange,
    checksum
  ];
}
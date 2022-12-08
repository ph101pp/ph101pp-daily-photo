import { TestERC1155MintRangeUpdateable, Ph101ppDailyPhoto } from "../typechain-types";

function findInRange(range: number[], needle: number) {
  for (let i = range.length - 1; i >= 0; i--) {
    if (needle >= range[i]) {
      return i;
    }
  }
  return 0;
}

export default async function _getUpdateInitialHoldersRangeInput(
  c: TestERC1155MintRangeUpdateable | Ph101ppDailyPhoto,
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
  if (from < 0 || from > to) {
    throw Error("Error: from < 0 || from > to");
  };
  const toAddresses: string[] = [];
  const fromAddresses: string[] = [];
  const ids: number[][] = [];
  const amounts: number[][] = [];
  const lastTokenId = await c.lastRangeTokenIdMinted();

  const too = to == Infinity ? lastTokenId : to;

  const zeroMinted = await c.isZeroMinted();

  if (zeroMinted) {
    for (let i = from; i <= too; i++) {
      const currentInitialHolders = await c.initialHolders(i);

      const balances = await c.balanceOfBatch(currentInitialHolders, currentInitialHolders.map(() => i));
      const isManuallyMinted = await c.isManualMint(i);
      if (isManuallyMinted) {
        continue;
      }

      for (let a = 0; a < currentInitialHolders.length; a++) {
        const fromAddress = currentInitialHolders[a];
        const toAddress = newInitialHolders[a];

        if(fromAddress === toAddress) {
          continue;
        }

        const balance = balances[a].toNumber();
        const isBalanceInitialized = await c.isBalanceInitialized(i, fromAddress)

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
  }
  const newInitialHoldersArray: string[][] = [];
  const newInitialHoldersRange: number[] = [];

  const [currentInitialHolders, currentInitialHoldersRangeBig] = await c.initialHoldersRange();

  for(let i=0; i<currentInitialHolders.length; i++) {
    if(currentInitialHolders[0].length !== newInitialHolders.length) {
      throw Error("Error: newInitialHolders.length does not match");
    }
  }

  const currentInitialHoldersRange = currentInitialHoldersRangeBig.map(n => n.toNumber());
  const toIndex = findInRange(currentInitialHoldersRange, to);
  let newRangeIndex = 0;
  let rangeSet = false;

  for (let i = 0; i < currentInitialHoldersRange.length; i++) {
    const current = currentInitialHoldersRange[i];

    if (current < from || current > to) {
      newInitialHoldersRange[newRangeIndex] = currentInitialHoldersRange[i];
      newInitialHoldersArray[newRangeIndex] = currentInitialHolders[i];
      newRangeIndex++;

    } else if (current >= from && current <= to) {
      if(rangeSet){
        continue;
      }
      newInitialHoldersRange[newRangeIndex] = from;
      newInitialHoldersArray[newRangeIndex] = newInitialHolders;
      newRangeIndex ++;
      rangeSet = true;

      if (to === Infinity) {
        break;
      }
      if(!currentInitialHoldersRange.includes(to+1)) {
        newInitialHoldersRange[newRangeIndex] = to + 1;
        newInitialHoldersArray[newRangeIndex] = currentInitialHolders[toIndex];
        newRangeIndex ++;
      }
    }
  }
  if (!rangeSet) {
    newInitialHoldersRange.push(from);
    newInitialHoldersArray.push(newInitialHolders);
    if (to !== Infinity) {
      newInitialHoldersRange.push(to + 1);
      newInitialHoldersArray.push(currentInitialHolders[toIndex]);
    }
  }

  const checksum = await c.verifyUpdateInitialHolderRangeInput(
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
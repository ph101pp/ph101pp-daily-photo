import { ERC1155MintRangeTestContract } from "../typechain-types";

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
  const amounts: number[][]= [];

  for (let i = from; i <= to; i++) {
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
        if(addressIndex<0) {
          fromAddresses.push(fromAddress);
          toAddresses.push(toAddress);
          addressIndex = fromAddresses.length-1;
        }
        ids[addressIndex] = ids[addressIndex]??[];
        ids[addressIndex].push(i);
        amounts[addressIndex] = amounts[addressIndex]??[];
        amounts[addressIndex].push(balance);
      }
    }
  }

  const newInitialHoldersArray = [newInitialHolders];
  const newInitialHoldersRange = [0];

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
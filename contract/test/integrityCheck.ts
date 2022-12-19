import { ERC1155MintRange, ERC1155MintRangePausable, ERC1155MintRangeUpdateable, IERC1155, Ph101ppDailyPhoto, TestERC1155MintRange, TestERC1155MintRangePausable, TestERC1155MintRangeUpdateable } from "../typechain-types";
import { expect } from "chai";
import { ContractTransaction, Event,  BigNumber } from "ethers";
import { ethers } from "hardhat";

type CheckRange = (addresses: string[], from: number, to: number) => Promise<RangeChecks>
type CheckIds = (addresses: string[], ids: number[]) => Promise<RangeChecks>
type CheckTransfers = (fromAddresses: string[], toAddresses: string[], ids: number[][], amounts: number[][]) => Promise<TransferCheck>
type CheckTransferSingle = (fromAddress: string, toAddress: string, id: number, amount: number) => Promise<TransferCheck>
type CheckTransferBatch = (fromAddresses: string, toAddresses: string, ids: number[], amounts: number[]) => Promise<TransferCheck>
type CheckTransfersMintRange = (initialHolders: string[], input: ERC1155MintRange.MintRangeInputStructOutput) => Promise<TransferCheck>
type CheckTransfersUpdateInitialHolderRanges = (input: ERC1155MintRangeUpdateable.UpdateInitialHolderRangesInputStruct) => Promise<TransferCheck>

type IntegrityChecks = {
  range: CheckRange,
  ids: CheckIds,
  transfers: CheckTransfers
  transferSingle: CheckTransferSingle
  transferBatch: CheckTransferBatch
  transfersMintRange: CheckTransfersMintRange
  transfersUpdateInitialHolderRanges: CheckTransfersUpdateInitialHolderRanges
}

type BalancesRangeResults = { [address: string]: { [id: string]: number } };
type BalancesRangeDelta = { [address: string]: { [id: string]: number } };
type BalancesRangeCheck = {
  balances: BalancesRangeResults
  expectEqual: () => Promise<void>
  expectDelta: (delta: BalancesRangeDelta) => Promise<void>
}
type SuppliesRangeResults = { [id: string]: number };
type SuppliesRangeDelta = { [id: string]: number };
type SuppliesRangeCheck = {
  supplies: SuppliesRangeResults
  expectEqual: () => Promise<void>
  expectDelta: (delta: SuppliesRangeDelta) => Promise<void>
}

type RangeChecks = {
  balances: (expected?: number[][]) => Promise<BalancesRangeCheck>
  supplies: (expected?: number[]) => Promise<SuppliesRangeCheck>
}

type NormalizedTransfer = {
  from: string,
  to: string,
  ids: number[]
  amounts: number[]
}

type TransferCheck = {
  balances: BalancesRangeCheck,
  supplies: SuppliesRangeCheck,
  expectSuccess: (transactions: ContractTransaction) => Promise<void>
}

type Contracts = TestERC1155MintRange | TestERC1155MintRangePausable | TestERC1155MintRangeUpdateable | Ph101ppDailyPhoto;

export default function integrityCheck(c: Contracts): IntegrityChecks {

  async function checkRange(addresses: string[], from: number, to: number) {
    const rangeIds = [];
    for (let i = from; i <= to; i++) {
      rangeIds.push(i);
    }
    return await checkIds(addresses, rangeIds);
  }

  async function checkIds(addresses: string[], ids: number[]) {
    return {
      balances: balancesRangeCheck(c, addresses, ids),
      supplies: suppliesRangeCheck(c, ids),
    };
  }

  const transfersMintRange = (c: Contracts): CheckTransfersMintRange => (initialHolders, input) => {
    const from = new Array(initialHolders.length).fill(ethers.constants.AddressZero);
    const ids = input.ids.map(bn => bn.toNumber());
    const amounts = input.amounts.map(BNs => BNs.map(bn => bn.toNumber()));
    return checkTransfers(c)(from, initialHolders, new Array(amounts.length).fill(ids), amounts);
  }

  const transfersUpdateInitialHolderRanges = (c: Contracts): CheckTransfersUpdateInitialHolderRanges => (input) => {
    const ids = input.ids.map(BNs => BNs.map(bn => BigNumber.from(bn).toNumber()));
    const amounts = input.amounts.map(BNs => BNs.map(bn => BigNumber.from(bn).toNumber()));
    return checkTransfers(c)(input.fromAddresses as string[], input.toAddresses as string[], ids, amounts);
  }

  const transferBatch = (c: Contracts): CheckTransferBatch => (from, to, ids, amounts) => {
    return checkTransfers(c)([from], [to], [ids], [amounts]);
  }
  const transferSingle = (c: Contracts): CheckTransferSingle => (from, to, id, amount) => {
    return checkTransfers(c)([from], [to], [[id]], [[amount]]);
  }

  return {
    ids: checkIds,
    range: checkRange,
    transfers: checkTransfers(c),
    transferSingle: transferSingle(c),
    transferBatch: transferBatch(c),
    transfersMintRange: transfersMintRange(c),
    transfersUpdateInitialHolderRanges: transfersUpdateInitialHolderRanges(c),
  }
}

const balancesRangeCheck = (c: Contracts, addresses: string[], ids: number[]) => async (expected?: number[][]): Promise<BalancesRangeCheck> => {
  const currBalances = await getBalances(c, addresses, ids);

  if (expected) {
    // expect(addresses.length).to.be.equal(expected.length);
    addresses.forEach((address, i) => {
      ids.forEach((id, k)=>{
        expect(expected[i][k]).to.be.equal(currBalances[address][id]);
      })
    })
  }

  return {
    balances: currBalances,
    expectEqual: async () => {
      const newBalances = await getBalances(c, addresses, ids);
      expect(currBalances).to.deep.equal(newBalances);
    },
    expectDelta: async (delta: BalancesRangeDelta) => {
      const currBalancesCopy = JSON.parse(JSON.stringify(currBalances));
      const newBalances = await getBalances(c, addresses, ids);

      addresses.forEach((address, i) => {
        const changedIds = Object.keys(delta[address]);

        changedIds.forEach((id) => {
          const index = ids.indexOf(parseInt(id));

          expect(index).to.be.gte(0, "delta: id not part of range");

          const oldBalance = currBalancesCopy[address][index];
          const newBalance = newBalances[address][index];

          expect(newBalance - oldBalance).to.be.eq(delta[address][parseInt(id)]);

          delete currBalancesCopy[address][index];
          delete newBalances[address][index];
        });
      });
      expect(currBalancesCopy).to.deep.equal(newBalances);
    }
  }
};

const suppliesRangeCheck = (c: Contracts, ids: number[]) => async (expected?: number[]): Promise<SuppliesRangeCheck> => {
  const currSupplies = await getSupplies(c, ids);

  if (expected) {
    ids.forEach((id, k)=>{
      expect(expected[k]).to.be.equal(currSupplies[id]);
    })
  }

  return {
    supplies: currSupplies,
    expectEqual: async () => {
      const newBalances = await getSupplies(c, ids);
      expect(currSupplies).to.deep.equal(newBalances);
    },
    expectDelta: async (delta: SuppliesRangeDelta) => {
      const currSuppliesCopy = JSON.parse(JSON.stringify(currSupplies));
      const newSupplies = await getSupplies(c, ids);

      const changedIds = Object.keys(delta);

      changedIds.forEach((id) => {
        const index = ids.indexOf(parseInt(id));

        expect(index).to.be.gte(0, "delta: id not part of range");

        const oldSupply = currSuppliesCopy[index];
        const newSupply = newSupplies[index];

        expect(newSupply - oldSupply).to.be.equal(delta[id]);

        delete currSuppliesCopy[index];
        delete newSupplies[index];
      });
      expect(currSuppliesCopy).to.deep.equal(newSupplies);
    }
  }
};

const getSupplies = async (c: Contracts, ids: number[]): Promise<SuppliesRangeResults> => {
  const totalSupplies = await Promise.all(
    ids.map((id) => {
      return c.totalSupply(id);
    })
  );
  const result: SuppliesRangeResults = {};
  totalSupplies.forEach((supply, i) => {
    result[ids[i]] = supply.toNumber()
  })

  return result;
};

const getBalances = async (c: Contracts, addresses: string[], ids: number[]): Promise<BalancesRangeResults> => {
  const balances: BalancesRangeResults = {};

  await Promise.all(addresses.map(async (address) => {
    if (address === ethers.constants.AddressZero) {
      return new Array(ids.length).fill(0);
    }

    const addresses = new Array(ids.length).fill(address);
    const addressBalances = await c.balanceOfBatch(addresses, ids);

    balances[address] = balances[address] ?? {};
    addressBalances.forEach((balance, i) => {
      balances[address][ids[i]] = balance.toNumber()
    })
  }));

  return balances
}

const checkTransfers = (c: Contracts,) => async (fromAddresses: string[], toAddresses: string[], ids: number[][], amounts: number[][]): Promise<TransferCheck> => {
  const uniqueAddresses = [...new Set(fromAddresses.concat(toAddresses))];
  const uniqueIds = [...new Set(ids.flat())]
  const beforeIntegrity = await integrityCheck(c).ids(uniqueAddresses, uniqueIds);
  const beforeBalances = await beforeIntegrity.balances();
  const beforeSupplies = await beforeIntegrity.supplies();

  return {
    balances: beforeBalances,
    supplies: beforeSupplies,
    expectSuccess: async (transaction) => {
      const receipt = await transaction.wait();
      const expectedTransfers: NormalizedTransfer[] = fromAddresses.map((from, i) => ({ from, to: toAddresses[i], ids: ids[i], amounts: amounts[i] }));
      const receivedTransferEvents = normalizeTransferEvents(receipt.events);

      expect(expectedTransfers.length).to.be.eq(receivedTransferEvents.length);

      const afterIntegrity = await integrityCheck(c).ids(uniqueAddresses, uniqueIds);
      const afterBalances = await afterIntegrity.balances();
      const afterSupplies = await afterIntegrity.supplies();

      const supplyChange: { [id: string]: number } = {};

      expectedTransfers.forEach((transfer) => {
        const transferEvent = receivedTransferEvents.find((event) => {
          return (
            event.to === transfer.to &&
            event.from === transfer.from &&
            JSON.stringify(event.ids) === JSON.stringify(transfer.ids) &&
            JSON.stringify(event.amounts) === JSON.stringify(transfer.amounts)
          );
        });

        // got corresponding event.
        expect(transferEvent).to.not.be.undefined;

        transfer.ids.forEach((id, i) => {
          supplyChange[id] = supplyChange[id] ?? 0;

          const amount = transfer.amounts[i];
          if (transfer.from !== ethers.constants.AddressZero) {
            expect(beforeBalances.balances[transfer.from][id] - amount).to.equal(afterBalances.balances[transfer.from][id]);
          }
          else {
            supplyChange[id] += amount;
          }

          if (transfer.to !== ethers.constants.AddressZero) {
            expect(beforeBalances.balances[transfer.to][id] + amount).to.equal(afterBalances.balances[transfer.to][id])
          }
          else {
            supplyChange[id] -= amount;
          }

          if (transfer.to !== ethers.constants.AddressZero && transfer.from !== ethers.constants.AddressZero) {
            expect(beforeSupplies.supplies[id]).to.equal(afterSupplies.supplies[id])
          }
        })

      });
      Object.entries(supplyChange).forEach(([id, amount]) => {
        expect(beforeSupplies.supplies[id] + amount).to.equal(afterSupplies.supplies[id]);
      })
    }
  }
}

const normalizeTransferEvents = (events?: Event[]): NormalizedTransfer[] => {
  const transferBatchEvents = events?.filter(e => e.event === "TransferBatch") ?? [];
  const transferSingleEvents = events?.filter(e => e.event === "TransferSingle") ?? [];
  const normalizedBatchEvents = transferBatchEvents.map((event) => ({
    from: event.args![1],
    to: event.args![2],
    ids: event.args![3].map((bn: BigNumber) => bn.toNumber()),
    amounts: event.args![4].map((bn: BigNumber) => bn.toNumber()),
  }));
  const normalizedSingleEvents = transferSingleEvents.map((event) => ({
    from: event.args![1],
    to: event.args![2],
    ids: [event.args![3].toNumber()],
    amounts: [event.args![4].toNumber()],
  }));

  return [...normalizedSingleEvents, ...normalizedBatchEvents]
}
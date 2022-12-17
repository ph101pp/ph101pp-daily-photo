import { ERC1155MintRange, ERC1155MintRangePausable, ERC1155MintRangeUpdateable, IERC1155, Ph101ppDailyPhoto } from "../typechain-types";
import { expect } from "chai";

type CheckRange = (from: number, to: number) => Promise<verify>
type CheckIds = (ids: number[]) => Promise<verify>

type integrityChecks = {
  range: CheckRange,
  ids: CheckIds
}

type verify = {
  balances: (expected?: number[][]) => Promise<verify>
  supply: (expected?: number[][]) => Promise<verify>
  all: () => Promise<verify>
}

type Contracts = ERC1155MintRange | ERC1155MintRangePausable | ERC1155MintRangeUpdateable | Ph101ppDailyPhoto;

type BalancesAndSupply = {
  balances: { [address: string]: number[] },
  totalSupplies: { [address: string]: number[] }
}

export default function integrityCheck(c: Contracts, addresses: string[]): integrityChecks {

  async function range(from: number, to: number) {
    const rangeIds = [];
    for (let i = from; i <= to; i++) {
      rangeIds.push(i);
    }
    return await ids(rangeIds);
  }

  async function ids(ids: number[]) {
    let prevSupplies = await getSupplies(c, addresses, ids);
    let prevBalances = await getBalances(c, addresses, ids);

    const rangeChecks= () => ({
      balances: async (expected?: number[][]) => {
        const currBalances = await getBalances(c, addresses, ids);

        if (expected) {
          expect(addresses.length).to.be.equal(expected.length);
          addresses.forEach((address, i) => {
            expect(expected[i]).to.deep.equal(currBalances[address]);
          })
        }
        else {
          expect(currBalances).to.deep.equal(prevBalances);
        }
        prevBalances = currBalances;
        return rangeChecks();
      },
      supply: async (expected?: number[][]) => {
        const currSupplies = await getSupplies(c, addresses, ids);

        if (expected) {
          expect(addresses.length).to.be.equal(expected.length);
          addresses.forEach((address, i) => {
            expect(expected[i]).to.deep.equal(currSupplies[address]);
          })
        }
        else {
          expect(currSupplies).to.deep.equal(prevSupplies);
        }
        prevSupplies = currSupplies;
        return rangeChecks();
      },
      all: async () => {
        const currSupplies = await getSupplies(c, addresses, ids);
        const currBalances = await getBalances(c, addresses, ids);

        expect(currSupplies).to.deep.equal(prevSupplies);
        expect(currBalances).to.deep.equal(prevBalances);

        prevSupplies = currSupplies;
        prevBalances = currBalances;

        return rangeChecks();
      }
    })

    return rangeChecks();
  }

  return {
    ids,
    range
  }
}

async function getSupplies(c: Contracts, addresses: string[], ids: number[]): Promise<{ [address: string]: number[] }> {
  const totalSupplies: { [address: string]: number[] } = {};

  await Promise.all(addresses.map(async (address) => {
    const addressTotalSupplies = await Promise.all(
      ids.map((id) => {
        return c.totalSupply(id);
      })
    );

    totalSupplies[address] = addressTotalSupplies.map((bn) => bn.toNumber());
  }));

  return totalSupplies;
}

async function getBalances(c: Contracts, addresses: string[], ids: number[]): Promise<{ [address: string]: number[] }> {
  const balances: { [address: string]: number[] } = {};

  await Promise.all(addresses.map(async (address) => {
    const addresses = new Array(ids.length).fill(address);
    const addressBalances = await c.balanceOfBatch(addresses, ids);

    balances[address] = addressBalances.map((bn) => bn.toNumber());
  }));

  return balances
}
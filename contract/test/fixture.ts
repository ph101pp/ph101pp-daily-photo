import { ethers } from "hardhat";
import { TestERC1155MintRange, TestERC1155MintRangePausable, TestERC1155MintRangeUpdateable } from "../typechain-types";
import integrityCheck from "./integrityCheck";

export type SignerWithAddress = Awaited<ReturnType<typeof ethers.getSigner>>
export type Fixture<T> = {
  c: T,
  owner: SignerWithAddress,
  account1: SignerWithAddress,
  account2: SignerWithAddress,
  account3: SignerWithAddress,
  account4: SignerWithAddress,
  account5: SignerWithAddress,
  account6: SignerWithAddress,
  account7: SignerWithAddress,
  account8: SignerWithAddress,
}
type Contracts = TestERC1155MintRange | TestERC1155MintRangePausable | TestERC1155MintRangeUpdateable;

type Mutable<T> = { -readonly [P in keyof T]: T[P] };


export function deployFixture<T extends Contracts>(contractName: string): () => Promise<Fixture<T>> {
  return async function fixture() {
    // Contracts are deplodyed using the first signer/account by default
    const [owner, account1, account2, account3, account4, account5, account6, account7, account8] = await ethers.getSigners();

    const C = await ethers.getContractFactory(contractName);
    const c = await C.deploy([]) as T;

    return { c, owner, account1, account2, account3, account4, account5, account6, account7, account8 };
  }
}

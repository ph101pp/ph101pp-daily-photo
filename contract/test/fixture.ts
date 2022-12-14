import { ethers } from "hardhat";

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

export function deployFixture<T>(contractName: string): () => Promise<Fixture<T>> {
  return async function fixture() {
    // Contracts are deplodyed using the first signer/account by default
    const [owner, account1, account2, account3, account4, account5, account6, account7, account8] = await ethers.getSigners();

    let c: T; 
    if (contractName === "TestERC1155MintRangeUpdateable") {
      const DT = await ethers.getContractFactory("Ph101ppDailyPhotoUtils");
      const dt = await DT.deploy();
      c = await ethers.getContractFactory("TestERC1155MintRangeUpdateable", {
        libraries: {
          "Ph101ppDailyPhotoUtils": dt.address, // test: "0x947cc35992e6723de50bf704828a01fd2d5d6641" //dt.address
        }
      }) as T;
    }
    else {

      const C = await ethers.getContractFactory(contractName);
      c = await C.deploy([]) as T;
    }

    return { c, owner, account1, account2, account3, account4, account5, account6, account7, account8 };
  }
}

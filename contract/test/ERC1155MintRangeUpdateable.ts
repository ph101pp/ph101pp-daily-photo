import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import _getUpdateInitialHoldersInputSafe, { _getUpdateInitialHoldersInput } from "../scripts/_getUpdateInitialHoldersInput";
import { testERC1155MintRange } from "./ERC1155MintRange";
import { testERC1155MintRangePausable } from "./ERC1155MintRangePausable";
import { TestERC1155MintRangeUpdateable, Ph101ppDailyPhoto, ERC1155MintRangeUpdateable, Pausable__factory } from "../typechain-types";
import { deployFixture, Fixture } from "./fixture";
import verified from "./verified";
import integrityCheck from "./integrityCheck";


async function fixture<T>() {
  // Contracts are deplodyed using the first signer/account by default
  const [owner, account1, account2, account3, account4, account5, account6, account7, account8] = await ethers.getSigners();

  const DT = await ethers.getContractFactory("Ph101ppDailyPhotoUtils");
  const dt = await DT.deploy();
  const C = await ethers.getContractFactory("TestERC1155MintRangeUpdateable", {
    libraries: {
      "Ph101ppDailyPhotoUtils": dt.address, // test: "0x947cc35992e6723de50bf704828a01fd2d5d6641" //dt.address
    }
  })
  const c = await C.deploy([]) as T;

  return { c, owner, account1, account2, account3, account4, account5, account6, account7, account8 };
}

describe("TestERC1155MintRangeUpdateable", function () {
  testERC1155MintRange(fixture);
  testERC1155MintRangePausable(fixture);
  testERC1155MintRangeUpdateable(fixture);
});

export function testERC1155MintRangeUpdateable(deployFixture: () => Promise<Fixture<TestERC1155MintRangeUpdateable>>) {

  async function setupRandomContractStateUnstructured({ c, owner, account1, account2, account3, account4, account5, account6, account7, account8 }: Fixture<TestERC1155MintRangeUpdateable>) {
    const mintIds = [0, 5, 10, 15, 20];
    await verified.mintBatch(c, account1.address, mintIds, new Array(mintIds.length).fill(20 * 8), []);

    const initialHolders1 = [account2.address, account3.address];
    await c.setInitialHolders(initialHolders1);
    const inputs = await c.getMintRangeInput(8);
    await verified.mintRange(c, ...inputs)

    const initialHolders2 = [account4.address, account5.address];
    await c.setInitialHolders(initialHolders2);
    const inputs2 = await c.getMintRangeInput(8);
    await verified.mintRange(c, ...inputs2)

    for (let i = 0; i < mintIds.length; i++) {
      const id = mintIds[i];
      await verified.connect(account1).safeTransferFrom(c, account1.address, account3.address, id, 1, []);
      await verified.connect(account1).safeTransferFrom(c, account1.address, account4.address, id, 1, []);
      await verified.connect(account1).safeTransferFrom(c, account1.address, account6.address, id, 1, []);
    };

    const transferIds = [4, 6, 8, 14, 16, 18];
    for (let i = 0; i < transferIds.length; i++) {
      const id = transferIds[i];
      const owner = mintIds.includes(id) ? account1 : id < 10 ? account2 : account5;
      await verified.connect(owner).safeTransferFrom(c, owner.address, account1.address, id, 1, []);
      await verified.connect(owner).safeTransferFrom(c, owner.address, account4.address, id, 1, []);
      await verified.connect(owner).safeTransferFrom(c, owner.address, account6.address, id, 1, []);
    };

    return await integrityCheck(c).range([account1, account2, account3, account4, account5, account6, account7, account8].map((s) => s.address), 0, 20);
  }

  async function setupRandomContractStateUnstructuredMulti({ c, owner, account1, account2, account3, account4, account5, account6, account7, account8 }: Fixture<TestERC1155MintRangeUpdateable>) {
    const mintIds = [0, 5, 10, 15, 20];
    await verified.mintBatch(c, account1.address, mintIds, new Array(mintIds.length).fill(20 * 8), []);

    const initialHolders1 = [account2.address, account3.address];
    await c.setInitialHolders(initialHolders1);
    const inputs = await c.getMintRangeInput(8);
    await verified.mintRange(c, ...inputs)

    const initialHolders2 = [account4.address, account5.address];
    await c.setInitialHolders(initialHolders2);
    const inputs2 = await c.getMintRangeInput(8);
    await verified.mintRange(c, ...inputs2)

    await c.setInitialHolders([account2.address]);
    const inputs3 = await c.getMintRangeInput(8);
    await verified.mintRange(c, ...inputs3)

    for (let i = 0; i < mintIds.length; i++) {
      const id = mintIds[i];
      await verified.connect(account1).safeTransferFrom(c, account1.address, account3.address, id, 1, []);
      await verified.connect(account1).safeTransferFrom(c, account1.address, account4.address, id, 1, []);
      await verified.connect(account1).safeTransferFrom(c, account1.address, account6.address, id, 1, []);
    };

    const transferIds = [4, 6, 8, 14, 16, 18];
    for (let i = 0; i < transferIds.length; i++) {
      const id = transferIds[i];
      const owner = mintIds.includes(id) ? account1 : id < 10 ? account2 : account5;
      await verified.connect(owner).safeTransferFrom(c, owner.address, account1.address, id, 1, []);
      await verified.connect(owner).safeTransferFrom(c, owner.address, account4.address, id, 1, []);
      await verified.connect(owner).safeTransferFrom(c, owner.address, account6.address, id, 1, []);
    };

    return await integrityCheck(c).range([account1, account2, account3, account4, account5, account6, account7, account8].map((s) => s.address), 0, 20);
  }
  describe("updateInitialHoldersInputSafe / _getUpdateInitialHoldersInputSafe / verifyUpdateInitialHoldersInput", function () {

    it("should fail when getting bad input or not paused", async function () {
      const fixture = await loadFixture(deployFixture);
      const { c, account1, account2, account3, account4, account6 } = fixture;
      const integrity = await setupRandomContractStateUnstructured(fixture);

      await expect(_getUpdateInitialHoldersInputSafe(c, [[account3.address, account2.address]], [0])).to.be.rejectedWith("Pausable: not paused");
      await c.pause();
      // different amount of addresses for tokenId
      // await expect(_getUpdateInitialHoldersInput(c, [[account3.address], [account3.address]], [0,20])).to.be.rejectedWith("U:05");
      // holders and range length
      await expect(_getUpdateInitialHoldersInputSafe(c, [[account3.address, account2.address], [account2.address, account3.address]], [0])).to.be.rejectedWith("U:01");
      // range must start at 0 
      await expect(_getUpdateInitialHoldersInputSafe(c, [[account3.address, account2.address]], [1])).to.be.rejectedWith("U:01");
      // range can't be longer than last tokenId 
      await expect(_getUpdateInitialHoldersInputSafe(c, [[account3.address, account2.address], [account2.address, account4.address], [account3.address]], [0, 40])).to.be.rejectedWith("U:01");
      // range must be consecutive
      await expect(_getUpdateInitialHoldersInputSafe(c, [[account3.address, account2.address], [account4.address, account2.address], [account2.address, account3.address]], [0, 2, 1])).to.be.rejectedWith("U:05");
      // Same address multiple times for tokenId
      await expect(_getUpdateInitialHoldersInputSafe(c, [[account3.address, account3.address]], [0])).to.be.rejectedWith("U:07");
      // isHolderAddress
      await expect(_getUpdateInitialHoldersInputSafe(c, [[account6.address, account3.address]], [0])).to.be.rejectedWith("U:10");

      await expect(_getUpdateInitialHoldersInputSafe(c, [[account3.address, account2.address]], [0])).to.not.be.rejected;
      await expect(_getUpdateInitialHoldersInputSafe(c, [[account3.address, account2.address], [account2.address, account4.address]], [0, 4])).to.not.be.rejected;
      await expect(_getUpdateInitialHoldersInputSafe(c, [[account3.address, account2.address], [account2.address, account4.address], [account3.address, account4.address]], [0, 1, 2])).to.not.be.rejected;
    })

    it("should skip manuallyMinted tokens && reinitialize initializedBalances", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      const initialHolders = [account1.address];
      await c.setInitialHolders(initialHolders);
      await verified.mintBatch(c, account2.address, [0, 1], [10, 10], []);
      const mintIntput = await c.getMintRangeInput(5);
      await verified.mintRange(c, ...mintIntput);
      // console.log(await c.balanceOf(account1.address, 5))
      await verified.connect(account1).safeTransferFrom(c, account1.address, account3.address, 5, 3, []);
      await c.pause();

      const [{ fromAddresses, toAddresses, ids, amounts, ...rest }, checksum] = await _getUpdateInitialHoldersInputSafe(c, [[account4.address]], [0]);
      expect(fromAddresses.length).to.equal(1);
      expect(toAddresses.length).to.equal(1);
      expect(ids.length).to.equal(1);
      expect(amounts.length).to.equal(1);

      expect(ids[0]).to.not.include(0);
      expect(ids[0]).to.not.include(1);
      expect(ids[0]).to.not.include(5);

      const integrity = await integrityCheck(c).ids([account1.address, account2.address, account3.address, account4.address], [0, 1, 5]);
      const balancesCheck = await integrity.balances();
      const supplyCheck = await integrity.supplies();

      await verified.updateInitialHolders(c, { fromAddresses, toAddresses, ids, amounts, ...rest });

      await balancesCheck.expectEqual()
      await supplyCheck.expectEqual()

      expect(await c.balanceOf(account4.address, 5)).to.equal(0);
      expect(await c.balanceOf(account3.address, 5)).to.equal(3);
      expect(await c.balanceOf(account1.address, 5)).to.equal(2);
    });

    it("should correcly update initialHolders of a simple range", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(5);
      const ids = mintIntput[0][0];
      await verified.mintRange(c, ...mintIntput);
      await c.pause();
      const newInitialHolders = [account1.address, account3.address];
      const [rangeInput] = await _getUpdateInitialHoldersInputSafe(c, [newInitialHolders], [0]);

      const tx = await verified.updateInitialHolders(c, rangeInput);

      const receipt = await tx.wait();

      expect(receipt.events?.filter(e => e.event === "Paused").length).to.equal(1);
      expect(receipt.events?.filter(e => e.event === "Unpaused").length).to.equal(1);

      expect(receipt.events?.filter(e => e.event === "TransferBatch").length).to.equal(rangeInput.ids.length);

      const balancesAccount1 = await c.balanceOfBatch(ids.map(() => account1.address), ids);
      const balancesAccount2 = await c.balanceOfBatch(ids.map(() => account2.address), ids);
      const balancesAccount3 = await c.balanceOfBatch(ids.map(() => account3.address), ids);

      for (let i = 0; i < ids.length; i++) {
        if (i === 0) {
          expect(balancesAccount1[i]).to.equal(9999);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(9999);
        }
        else {
          expect(balancesAccount1[i]).to.equal(i);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(i);
        }
      }
    });

    it("should correcly update initialHolders across multiple ranges", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const mintIntput = await c.getMintRangeInput(2);
      await verified.mintRange(c, ...mintIntput);
      await c.setInitialHolders([account2.address]);
      const mintIntput2 = await c.getMintRangeInput(2);
      await verified.mintRange(c, ...mintIntput2);
      await c.setInitialHolders([account3.address]);
      const mintIntput3 = await c.getMintRangeInput(2);
      await verified.mintRange(c, ...mintIntput3);
      await c.pause();

      const [rangeInput] = await _getUpdateInitialHoldersInputSafe(c, [[account1.address], [account4.address], [account4.address]], [0, 2, 4]);
      const tx = await verified.updateInitialHolders(c, rangeInput);
      const receipt = await tx.wait();

      const empty = new Array(6).fill(0);

      const fromAddresses = rangeInput.fromAddresses;
      expect(receipt.events?.filter(e => e.event === "TransferBatch").length).to.equal(fromAddresses.length);

      const balancesAccount1 = await c.balanceOfBatch(empty.fill(account1.address), empty.map((x, i) => i));
      const balancesAccount2 = await c.balanceOfBatch(empty.fill(account2.address), empty.map((x, i) => i));
      const balancesAccount3 = await c.balanceOfBatch(empty.fill(account3.address), empty.map((x, i) => i));
      const balancesAccount4 = await c.balanceOfBatch(empty.fill(account4.address), empty.map((x, i) => i));

      for (let i = 0; i < 6; i++) {
        if (i === 0) {
          expect(balancesAccount1[i]).to.equal(9999);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(0);
          expect(balancesAccount4[i]).to.equal(0);
        }
        else if (i < 2) {
          expect(balancesAccount1[i]).to.equal(i);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(0);
          expect(balancesAccount4[i]).to.equal(0);
        }
        else {
          expect(balancesAccount1[i]).to.equal(0);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(0);
          expect(balancesAccount4[i]).to.equal(i);
        }
      }
    });

    it("should fail to create update initialHolders input when new holder is address(0)", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address];
      const initialHolders2 = [account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(5);
      await verified.mintRange(c, ...mintIntput);
      await c.pause();
      const newInitialHolders = [ethers.constants.AddressZero, account3.address];
      const newInitialHolders2 = [account1.address, ethers.constants.AddressZero];
      await expect(_getUpdateInitialHoldersInputSafe(c, [newInitialHolders], [0])).to.be.rejected;
      await expect(_getUpdateInitialHoldersInputSafe(c, [newInitialHolders2], [0])).to.be.rejected;
    });
  });

  describe("updateInitialHolders non-safe must not affect any minted / transferred tokens when updating initialHolders", function () {

    // async function setupRandomContractStateStructured({ c, owner, account1, account2, account3, account4, account5, account6, account7, account8 }: Fixture<TestERC1155MintRangeUpdateable>) {
    //   const mintIds = [0, 1, 2, 3, 4];
    //   const transferIds = [15, 16, 17, 18, 19];

    //   const initialHolders1 = [account1.address, account2.address];
    //   await c.setInitialHolders(initialHolders1);

    //   await verified.mintBatch(c, account1.address, mintIds, new Array(mintIds.length).fill(10), []);
    //   const inputs = await c.getMintRangeInput(5);
    //   await verified.mintRange(c, inputs[0])

    //   const initialHolders2 = [account3.address, account4.address];
    //   await c.setInitialHolders(initialHolders2);
    //   const inputs2 = await c.getMintRangeInput(10);
    //   await verified.mintRange(c, inputs2[0])

    //   for (let i = 0; i < mintIds.length; i++) {
    //     const id = mintIds[i]
    //     await verified.connect(account1).safeTransferFrom(c, account1.address, account5.address, id, 2, []);
    //     await verified.connect(account1).safeTransferFrom(c, account1.address, account6.address, id, 2, [])
    //   };

    //   for (let i = 0; i < transferIds.length; i++) {
    //     const id = transferIds[i];
    //     await verified.connect(account3).safeTransferFrom(c, account3.address, account5.address, id, 1, []);
    //     await verified.connect(account3).safeTransferFrom(c, account3.address, account7.address, id, 1, []);
    //   };

    //   return await integrityCheck(c).range([account1, account2, account3, account4, account5, account6, account7, account8].map((s) => s.address), 0, 19);
    // }

    it("should successfully change holders in various ways and revert everything", async function () {
      const fixture = await loadFixture(deployFixture);
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = fixture;

      const integrity = await setupRandomContractStateUnstructuredMulti(fixture);
      const supplyCheck = await integrity.supplies()
      const balancesCheck = await integrity.balances()

      await c.pause();

      const input1 = await _getUpdateInitialHoldersInputSafe(c, [
        [account3.address, account2.address],
        [account3.address]
      ], [0, 20]);
      await expect(verified.updateInitialHoldersSafe(c, ...input1)).to.not.be.rejected;

      const input2 = await _getUpdateInitialHoldersInputSafe(c, [
        [account3.address, account2.address],
        [account2.address, account8.address],
        [account7.address]
      ], [0, 4, 20]);
      await expect(c.updateInitialHoldersSafe(...input2)).to.not.be.rejected;

      const input3 = await _getUpdateInitialHoldersInputSafe(c, [
        [account3.address, account2.address],
        [account2.address, account8.address],
        [account3.address, account8.address],
        [account7.address]
      ],
        [0, 1, 2, 20]);
      await expect(c.updateInitialHoldersSafe(...input3)).to.not.be.rejected;

      const input4 = await _getUpdateInitialHoldersInputSafe(c, [
        [account8.address, account2.address],
        [account2.address, account3.address],
        [account3.address, account4.address],
        [account4.address, account5.address],
        [account8.address, account7.address],
        [account8.address]
      ], [0, 1, 2, 3, 4, 20]);
      await expect(c.updateInitialHoldersSafe(...input4)).to.not.be.rejected;

      const input5 = await _getUpdateInitialHoldersInputSafe(c, [
        [account2.address, account8.address],
        [account2.address],
      ], [0, 20]);
      await expect(c.updateInitialHoldersSafe(...input5)).to.not.be.rejected;

      const input6 = await _getUpdateInitialHoldersInputSafe(c, [
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address, account2.address],
        [account4.address],
      ], [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        11,
        12,
        13,
        14,
        15,
        20,
      ]);
      await expect(c.updateInitialHoldersSafe(...input6)).to.not.be.rejected;

      const input7 = await _getUpdateInitialHoldersInputSafe(c, [
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address, account2.address],
        [account5.address],
      ], [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        11,
        12,
        13,
        14,
        15,
        20
      ]);
      await expect(c.updateInitialHoldersSafe(...input7)).to.not.be.rejected;

      // revert everything:
      const revertInput = await _getUpdateInitialHoldersInputSafe(c, [
        [account2.address, account3.address],
        [account4.address, account5.address],
        [account2.address]
      ], [0, 10, 20]);
      await expect(c.updateInitialHoldersSafe(...revertInput)).to.not.be.rejected;

      // expect no changes to balances or supply
      await supplyCheck.expectEqual();
      await balancesCheck.expectEqual()

    })

    it("should fail when getting bad input or not paused", async function () {
      const fixture = await loadFixture(deployFixture);
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = fixture;
      const integrity = await setupRandomContractStateUnstructured(fixture);

      const noopInput = await _getUpdateInitialHoldersInput(c, [[account2.address, account3.address], [account4.address, account5.address]], [0, 10]);
      await expect(verified.updateInitialHolders(c, noopInput)).to.be.rejectedWith("Pausable: not paused");

      await c.pause();

      // different amount of addresses for tokenId
      const input2 = await _getUpdateInitialHoldersInput(c, [[account7.address]], [0]);
      await expect(c.updateInitialHolders(input2)).to.be.rejectedWith("H:04");

      // holders and range length
      const input3 = await _getUpdateInitialHoldersInput(c, [[account7.address, account8.address], [account7.address, account8.address]], [0]);
      await expect(c.updateInitialHolders(input3)).to.be.rejectedWith("H:03");

      // range must start at 0 
      const input4 = await _getUpdateInitialHoldersInput(c, [[account7.address, account8.address]], [1]);
      await expect(c.updateInitialHolders(input4)).to.be.rejectedWith("H:03");

      // range can't be longer than last tokenId 
      const input5 = await _getUpdateInitialHoldersInput(c, [[account7.address, account8.address], [account7.address, account8.address]], [0, 100]);
      await expect(c.updateInitialHolders(input5)).to.be.rejectedWith("H:03");

      // range must be consecutive
      const input6 = await _getUpdateInitialHoldersInput(c, [[account7.address, account8.address], [account7.address, account8.address], [account7.address, account8.address]], [0, 2, 1]);
      await expect(c.updateInitialHolders(input6)).to.be.rejectedWith("H:09");

      // Same address multiple times for tokenId
      const input7 = await _getUpdateInitialHoldersInput(c, [[account7.address, account7.address]], [0]);
      await expect(c.updateInitialHolders(input7)).to.be.rejectedWith("H:07");

      // isHolderAddress
      const input8 = await _getUpdateInitialHoldersInput(c, [[account3.address, account6.address]], [0]);
      await expect(c.updateInitialHolders(input8)).to.be.rejectedWith("H:06");

    })

    it("should not be possible to affect balances or supply when updating initialHolders", async function () {
      const fixture = await loadFixture(deployFixture);
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = fixture;

      const integrity = await setupRandomContractStateUnstructured(fixture);

      const supplyCheck = await integrity.supplies()
      const balancesCheck = await integrity.balances()

      // console.log(balancesCheck.balances);
      // console.log(supplyCheck.supplies);
      const baseNoopInput = {
        fromAddresses: [],
        toAddresses: [],
        ids: [],
        amounts: [],
        initialize: [],
        newInitialHolders: [
          [account2.address, account3.address], [account4.address, account5.address]
        ],
        newInitialHolderRanges: [0, 10]
      }
      await c.pause();

      const input1 = {
        ...baseNoopInput,
        newInitialHolders: [[account7.address, account8.address]]
      };
      const input2 = {
        ...baseNoopInput,
        newInitialHolders: [[account7.address, account8.address], [account7.address, ethers.constants.AddressZero]]
      };
      const input3 = {
        ...baseNoopInput,
        newInitialHolders: [[account6.address, account7.address, account8.address], [account7.address, account8.address]]
      };
      const input4 = {
        ...baseNoopInput,
        newInitialHolders: [[account7.address, account8.address], [account7.address, account8.address], [account7.address, account8.address]]
      };

      const input6 = await _getUpdateInitialHoldersInput(c, [[account7.address, account7.address], [account8.address, account8.address]], [0, 10]);

      const input7 = await _getUpdateInitialHoldersInputSafe(c, [[account7.address, account8.address], [account7.address, account8.address]], [0, 10]);
      const input8 = await _getUpdateInitialHoldersInput(c, [[account7.address, account8.address], [account4.address, account3.address], [account5.address, account2.address]], [0, 10, 7]);

      await expect(c.updateInitialHolders(input1)).to.be.rejectedWith("H:03"); // range length mismatch
      await expect(c.updateInitialHolders(input4)).to.be.rejectedWith("H:03"); // range length mismatch
      await expect(c.updateInitialHolders(input3)).to.be.rejectedWith("H:04"); // holders length mismatch
      await expect(c.updateInitialHolders(input2)).to.be.rejectedWith("H:05"); // no address(0)
      await expect(c.updateInitialHolders(input6)).to.be.rejectedWith("H:07"); // only unique initial holders
      await expect(c.updateInitialHolders(input8)).to.be.rejectedWith("H:09"); // consecutive holder ranges

      await expect(verified.updateInitialHoldersSafe(c, ...input7)).to.not.be.rejected;

      await supplyCheck.expectEqual();

      const input5 = await _getUpdateInitialHoldersInputSafe(c, [[account2.address, account3.address], [account4.address, account5.address]], [0, 10]);
      await expect(verified.updateInitialHoldersSafe(c, ...input5)).to.not.be.rejected;

      // console.log(await balancesCheck.getBalances())
      // console.log(await supplyCheck.getSupplies())

      await supplyCheck.expectEqual();
      await balancesCheck.expectEqual();
    })

    it("should correctly transfer initialHolders when there were transfers", async function () {
      const fixture = await loadFixture(deployFixture);
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = fixture;

      await c.setInitialHolders([account1.address, account2.address]);

      const inputs = await c.getMintRangeInput(10);
      await verified.mintRange(c, ...inputs)


      const transferIds = [0, 2, 4, 6, 8,];
      for (let i = 0; i < transferIds.length; i++) {
        const id = transferIds[i];
        await verified.connect(account1).safeTransferFrom(c, account1.address, account2.address, id, 1, []);
        await verified.connect(account2).safeTransferFrom(c, account2.address, account5.address, id, 1, []);
      };


      const integrity = await integrityCheck(c).range([account1.address, account2.address, account3.address, account4.address, account5.address, account6.address], 0, 9)
      const supplyCheck = await integrity.supplies()
      const balancesCheck = await integrity.balances()

      const transferAllInput = {
        fromAddresses: [account1.address, account2.address],
        toAddresses: [account3.address, account4.address],
        ids: [
          [1, 3, 5, 7, 9],
          [1, 3, 5, 7, 9]
        ],
        amounts: [
          [1, 3, 5, 7, 9],
          [1, 3, 5, 7, 9],
        ],
        newInitialHolders: [
          [account3.address, account4.address]
        ],
        newInitialHolderRanges: [0]
      }

      await c.pause();
      await expect(verified.updateInitialHolders(c, transferAllInput)).to.not.be.rejected;

    });

    it("should correctly transfer initialHolders when there are manual mints without affecting supply", async function () {
      const fixture = await loadFixture(deployFixture);
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = fixture;


      await c.setInitialHolders([account1.address, account2.address]);
      await verified.mintBatch(c, account1.address, [0, 1, 2, 3, 4], [10, 10, 10, 10, 10], []);
      const inputs = await c.getMintRangeInput(5);
      await verified.mintRange(c, ...inputs)

      const integrity = await integrityCheck(c).range([account1.address, account2.address, account3.address, account4.address], 0, 9)
      const supplyCheck = await integrity.supplies()
      const balancesCheck = await integrity.balances()

      const transferAllInput = {
        fromAddresses: [account1.address, account2.address],
        toAddresses: [account3.address, account4.address],
        ids: [
          [5, 6, 7, 8, 9],
          [5, 6, 7, 8, 9],
        ],
        amounts: [
          [5, 6, 7, 8, 9],
          [5, 6, 7, 8, 9]
        ],
        newInitialHolders: [
          [account3.address, account4.address]
        ],
        newInitialHolderRanges: [0]
      }
      await c.pause();
      await expect(verified.updateInitialHolders(c, transferAllInput)).to.not.be.rejected;

      const expectedDelta = {
        [account1.address]: {
          // "0": -9999,
          // "1": -1,
          // "2": -2,
          // "3": -3,
          // "4": -4,
          "5": -5,
          "6": -6,
          "7": -7,
          "8": -8,
          "9": -9
        },
        [account2.address]: {
          // "0": -9999,
          // "1": -2,
          // "2": -2,
          // "3": -3,
          // "4": -4,
          "5": -5,
          "6": -6,
          "7": -7,
          "8": -8,
          "9": -9,
        },
        [account3.address]: {
          // "0": 9999,
          // "1": 1,
          // "2": 2,
          // "3": 3,
          // "4": 4,
          "5": 5,
          "6": 6,
          "7": 7,
          "8": 8,
          "9": 9,
        },
        [account4.address]: {
          // "0": 9999,
          // "1": 1,
          // "2": 2,
          // "3": 3,
          // "4": 4,
          "5": 5,
          "6": 6,
          "7": 7,
          "8": 8,
          "9": 9,
        },
      };

      await supplyCheck.expectEqual();
      await balancesCheck.expectDelta(expectedDelta);

      const transferAllInput2 = await _getUpdateInitialHoldersInputSafe(c, [
        [account3.address, account4.address]
      ], [0]);

      // running updates on the same range multiple times should have no effect
      await expect(verified.updateInitialHoldersSafe(c, ...transferAllInput2)).to.not.be.rejected;
      await expect(verified.updateInitialHoldersSafe(c, ...transferAllInput2)).to.not.be.rejected;

      await supplyCheck.expectEqual();
      await balancesCheck.expectDelta(expectedDelta);

    });

    it("should correctly swap two initialHolders", async function () {
      const fixture = await loadFixture(deployFixture);
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = fixture;

      const integrity = await setupRandomContractStateUnstructured(fixture);
      const supplyCheck = await integrity.supplies()
      const balancesCheck = await integrity.balances()

      await c.pause();

      const noop = await _getUpdateInitialHoldersInputSafe(c, [
        [account2.address, account3.address], [account4.address, account5.address]
      ], [0, 10]);

      const swap = await _getUpdateInitialHoldersInputSafe(c, [
        [account5.address, account3.address], [account4.address, account2.address]
      ], [0, 10]);

      await expect(verified.updateInitialHoldersSafe(c, ...noop)).to.not.be.rejected;
      await supplyCheck.expectEqual();

      await expect(verified.updateInitialHoldersSafe(c, ...swap)).to.not.be.rejected;

      await supplyCheck.expectEqual();
      await expect(balancesCheck.expectEqual()).to.throw;

      const swapBack = await _getUpdateInitialHoldersInputSafe(c, [
        [account2.address, account3.address], [account4.address, account5.address]
      ], [0, 10]);
      await expect(verified.updateInitialHoldersSafe(c, ...swapBack)).to.not.be.rejected;

      await supplyCheck.expectEqual();
      await balancesCheck.expectEqual()
    })
  })

  describe("Lock initial holders", function () {
    it("should fail to lock initial holders of unminted tokens or if tokens are already locked", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);

      await expect(c.setLockInitialHoldersUpTo(6)).to.be.rejectedWith("H:02") // Unminted tokens

      const initialHolders = [account1.address, account2.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(5);
      await verified.mintRange(c, ...mintIntput);

      await expect(c.setLockInitialHoldersUpTo(7)).to.be.rejectedWith("H:02")  // Unminted tokens
      await expect(c.setLockInitialHoldersUpTo(4)).to.not.be.rejected;

      await expect(c.setLockInitialHoldersUpTo(4)).to.be.rejectedWith("H:01"); // Locked tokens
    });

    it("should fail to lock initial holders when paused", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(5);
      await verified.mintRange(c, ...mintIntput);
      await c.pause();
      await expect(c.setLockInitialHoldersUpTo(4)).to.be.rejectedWith("Pausable: paused");
    });

    it("should fail to create update initialHolders input of locked range", async function () {
      const { c, account1, account2, account3, account4, account5, account6 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address];
      const initialHolders2 = [account3.address, account4.address];
      const initialHolders3 = [account2.address, account1.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(3);
      await verified.mintRange(c, ...mintIntput);
      await c.setInitialHolders(initialHolders2);
      const mintIntput2 = await c.getMintRangeInput(2);
      await verified.mintRange(c, ...mintIntput2);
      await c.setInitialHolders(initialHolders3);
      const mintIntput3 = await c.getMintRangeInput(2);
      await verified.mintRange(c, ...mintIntput3);
      await c.setLockInitialHoldersUpTo(4);
      await c.pause();
      const newInitialHolders = [account5.address, account6.address];
      await expect(_getUpdateInitialHoldersInputSafe(c, [newInitialHolders, initialHolders2, initialHolders3], [0, 3, 5])).to.be.rejectedWith("U:09");
      await expect(_getUpdateInitialHoldersInputSafe(c, [initialHolders, newInitialHolders, initialHolders3], [0, 3, 5])).to.be.rejectedWith("U:09");
      await expect(_getUpdateInitialHoldersInputSafe(c, [initialHolders, initialHolders2, newInitialHolders], [0, 3, 5])).to.not.be.rejected;
    });

  })
};
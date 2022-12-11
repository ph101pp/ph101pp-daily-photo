import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import _getUpdateInitialHoldersRangeInput from "../scripts/_getUpdateInitialHoldersRangeInput";
import { testERC1155MintRange } from "./ERC1155MintRange";
import { testERC1155MintRangePausable } from "./ERC1155MintRangePausable";
import { TestERC1155MintRangeUpdateable, Ph101ppDailyPhoto } from "../typechain-types";
import { deployFixture, Fixture } from "./fixture";


describe("TestERC1155MintRangeUpdateable", function () {
  testERC1155MintRange(deployFixture("TestERC1155MintRangeUpdateable"));
  testERC1155MintRangePausable(deployFixture("TestERC1155MintRangeUpdateable"));
  testERC1155MintRangeUpdateable(deployFixture("TestERC1155MintRangeUpdateable"));
});

export function testERC1155MintRangeUpdateable(deployFixture: ()=>Promise<Fixture<TestERC1155MintRangeUpdateable>>) {

  describe("verifyUpdateInitialHoldersRangeInput", function () {

    it("should return a hash when successfull", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const input = await c.getMintRangeInput(3);
      await c.mintRange(...input);
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.not.be.rejected;
    })

    it("should fail when contract is not paused", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.be.rejectedWith("Pausable: not paused");
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.not.be.rejectedWith("Pausable: not paused");
    })

    it("should fail when to address is not part of new initial holders", async function () {
      const { c, account1, account2, account3 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const input = await c.getMintRangeInput(3);
      await c.mintRange(...input);
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.not.be.rejected;
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account3.address]], [0])).to.be.rejectedWith("E:10");
    });

    it("should fail when number of initial holders dont match range", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const input = await c.getMintRangeInput(3);
      await c.mintRange(...input);
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.not.be.rejected;
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account1.address], [account2.address]], [0])).to.be.rejectedWith("E:04");
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account1.address]], [0, 1])).to.be.rejectedWith("E:04");
    });

    it("should fail when range does not start at 0 or isnt consecutive", async function () {
      const { c, account1, account2, account3 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const input = await c.getMintRangeInput(3);
      await c.mintRange(...input);
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.not.be.rejected;
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [1])).to.be.rejectedWith("E:05");
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account1.address], [account2.address], [account3.address]], [0, 3, 2])).to.be.rejectedWith("E:06");
    });

    it("should fail number of amounts, ids, to and from dont match", async function () {
      const { c, account1, account2, account3 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const input = await c.getMintRangeInput(3);
      await c.mintRange(...input);
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.not.be.rejected;
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1], [1]], [[account2.address]], [0])).to.be.rejectedWith("E:03");
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1], [1]], [[1]], [[account2.address]], [0])).to.be.rejectedWith("E:02");
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address, account3.address], [[1]], [[1]], [[account2.address]], [0])).to.be.rejectedWith("E:01");
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address, account3.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.be.rejectedWith("E:01");
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1, 2]], [[1]], [[account2.address]], [0])).to.be.rejectedWith("E:07");
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1, 1]], [[account2.address]], [0])).to.be.rejectedWith("E:07");
    });

    it("should fail when from account balance is less than amount", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const input = await c.getMintRangeInput(3);
      await c.mintRange(...input);
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.not.be.rejected;
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[2]], [[account2.address]], [0])).to.not.be.rejected;
      await expect(c.verifyUpdateInitialHolderRangeInput([account2.address], [account1.address], [[1]], [[2]], [[account1.address]], [0])).to.be.rejectedWith("E:08");
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[3]], [[account2.address]], [0])).to.be.rejectedWith("E:08");
    });

    it("should fail when id does not exist", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const input = await c.getMintRangeInput(3);
      await c.mintRange(...input);
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.not.be.rejected;
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[3]], [[2]], [[account2.address]], [0])).to.be.rejectedWith("E:11");
    });

    it("should fail when token balance for from/to addresses is initialized", async function () {
      const { c, account1, account2, account3 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address, account2.address]);
      const input = await c.getMintRangeInput(3);
      await c.mintRange(...input);
      await c.connect(account1).safeTransferFrom(account1.address, account3.address, 1, 1, []);
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.be.rejectedWith("E:13");
      await expect(c.verifyUpdateInitialHolderRangeInput([account2.address], [account3.address], [[1]], [[1]], [[account2.address]], [0])).to.be.rejectedWith("E:14");
    });

    it("should fail when token was minted manually", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      await c.mint(account1.address, 1, 1, []);
      const input = await c.getMintRangeInput(3);
      await c.mintRange(...input);
      await c.pause();
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[0]], [[1]], [[account2.address]], [0])).to.not.be.rejected;
      await expect(c.verifyUpdateInitialHolderRangeInput([account1.address], [account2.address], [[1]], [[1]], [[account2.address]], [0])).to.be.rejectedWith("E:12");
    });

  });

  describe("updateInitialHoldersRangeInput / _getUpdateInitialHoldersRangeInput / verifyUpdateInitialHoldersRangeInput", function () {
    const exampleRanges = [
      {
        initial: [0, 4, 5],
        input: [1, Infinity],
        expected: [0, 1]
      },
      {
        initial: [0, 4, 5, 7],
        input: [1, 5],
        expected: [0, 1, 6, 7]
      },
      {
        initial: [0, 4, 5, 7],
        input: [0, 5],
        expected: [0, 6, 7]
      },
      {
        initial: [0, 4, 5, 7],
        input: [7, 7],
        expected: [0, 4, 5, 7, 8]
      },
      {
        initial: [0, 4, 5, 7],
        input: [3, 4],
        expected: [0, 3, 5, 7]
      },
      {
        initial: [0, 4, 5, 7],
        input: [8, Infinity],
        expected: [0, 4, 5, 7, 8]
      },
      {
        initial: [0, 4, 5, 7],
        input: [6, Infinity],
        expected: [0, 4, 5, 6]
      },
      {
        initial: [0, 1, 2, 3, 4, 5, 6, 7],
        input: [4, 7],
        expected: [0, 1, 2, 3, 4, 8]
      }
    ]

    it("should fail when getting bad input or not paused", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address, account2.address]);

      await expect(_getUpdateInitialHoldersRangeInput(c, 1, 300, [account1.address, account2.address])).to.be.rejectedWith("Pausable: not paused");
      await c.pause();
      await _getUpdateInitialHoldersRangeInput(c, 1, 300, [account1.address, account2.address])
        .catch((e) => { expect(true).to.equal(false) });
      await _getUpdateInitialHoldersRangeInput(c, -1, 300, [account1.address, account2.address])
        .then(() => { expect(true).to.equal(false) })
        .catch((e) => { expect(e.message).to.equal("Error: from < 0 || from > to") });
      await _getUpdateInitialHoldersRangeInput(c, 1, 0, [account1.address, account2.address])
        .then(() => { expect(true).to.equal(false) })
        .catch((e) => { expect(e.message).to.equal("Error: from < 0 || from > to") });
      await _getUpdateInitialHoldersRangeInput(c, 0, 1, [account1.address])
        .then(() => { expect(true).to.equal(false) })
        .catch((e) => { expect(e.message).to.equal("Error: newInitialHolders.length does not match") });
    })

    it("should correcly update example ranges", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      await c.pause();
      for (let i = 0; i < exampleRanges.length; i++) {
        const example = exampleRanges[i];
        const initialHolders = new Array(example.initial.length).fill([account1.address]);
        const resetInput: [
          string[],
          string[],
          number[][],
          number[][],
          string[][],
          number[],
        ] = [[account1.address], [account2.address], [[]], [[]], initialHolders, example.initial]
        const checksum = await c.verifyUpdateInitialHolderRangeInput(...resetInput);
        await c.updateInitialHoldersRange(...resetInput, checksum);
        const rangeInput = await _getUpdateInitialHoldersRangeInput(c, example.input[0], example.input[1], [account2.address]);
        await c.updateInitialHoldersRange(...rangeInput);
        const [, initialHolderRange] = await c.initialHoldersRange();

        expect(example.expected).to.deep.equal(initialHolderRange.map(n => n.toNumber()));
      }
    })

    it("should skip initializedBalances or manuallyMinted tokens", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      const initialHolders = [account1.address];
      await c.setInitialHolders(initialHolders);
      await c.mintBatch(account2.address, [0, 1], [10, 10], []);
      const mintIntput = await c.getMintRangeInput(5);
      await c.mintRange(...mintIntput);
      await c.connect(account1).safeTransferFrom(account1.address, account3.address, 5, 3, []);
      await c.pause();

      const [fromAddresses, toAddresses, ids, amounts] = await _getUpdateInitialHoldersRangeInput(c, 0, Infinity, [account4.address]);

      expect(fromAddresses.length).to.equal(1);
      expect(toAddresses.length).to.equal(1);
      expect(ids.length).to.equal(1);
      expect(amounts.length).to.equal(1);

      expect(ids[0]).to.not.include(0);
      expect(ids[0]).to.not.include(1);
      expect(ids[0]).to.not.include(5);
    });

    it("should correcly update initialHolders of a simple range", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(5);
      const ids = mintIntput[0];
      await c.mintRange(...mintIntput);
      await c.pause();
      const newInitialHolders = [account1.address, account3.address];
      const rangeInput = await _getUpdateInitialHoldersRangeInput(c, 0, 3, newInitialHolders);
      const tx = await c.updateInitialHoldersRange(...rangeInput);
      const receipt = await tx.wait();
      const fromAddresses = rangeInput[0];
      expect(receipt.events?.filter(e => e.event === "Paused").length).to.equal(1);
      expect(receipt.events?.filter(e => e.event === "Unpaused").length).to.equal(1);
      expect(receipt.events?.filter(e => e.event === "TransferBatch").length).to.equal(fromAddresses.length);

      const balancesAccount1 = await c.balanceOfBatch(ids.map(() => account1.address), ids);
      const balancesAccount2 = await c.balanceOfBatch(ids.map(() => account2.address), ids);
      const balancesAccount3 = await c.balanceOfBatch(ids.map(() => account3.address), ids);

      for (let i = 0; i < ids.length; i++) {
        if (i === 0) {
          expect(balancesAccount1[i]).to.equal(9999);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(9999);
        }
        else if (i <= 3) {
          expect(balancesAccount1[i]).to.equal(i + 1);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(i + 1);
        }
        else {
          expect(balancesAccount1[i]).to.equal(i + 1);
          expect(balancesAccount2[i]).to.equal(i + 1);
          expect(balancesAccount3[i]).to.equal(0);
        }
      }
    });

    it("should correcly update initialHolders across multiple ranges", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const mintIntput = await c.getMintRangeInput(2);
      await c.mintRange(...mintIntput);
      await c.setInitialHolders([account2.address]);
      const mintIntput2 = await c.getMintRangeInput(2);
      await c.mintRange(...mintIntput2);
      await c.setInitialHolders([account3.address]);
      const mintIntput3 = await c.getMintRangeInput(2);
      await c.mintRange(...mintIntput3);
      await c.pause();

      const rangeInput = await _getUpdateInitialHoldersRangeInput(c, 1, 4, [account4.address]);
      const tx = await c.updateInitialHoldersRange(...rangeInput);
      const receipt = await tx.wait();

      const empty = new Array(6).fill(0);

      const fromAddresses = rangeInput[0];
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
        else if (i <= 4) {
          expect(balancesAccount1[i]).to.equal(0);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(0);
          expect(balancesAccount4[i]).to.equal(i + 1);
        }
        else {
          expect(balancesAccount1[i]).to.equal(0);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(i + 1);
          expect(balancesAccount4[i]).to.equal(0);
        }
      }
    });

    it("should correcly update initialHolders to infinity", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      await c.setInitialHolders([account1.address]);
      const mintIntput = await c.getMintRangeInput(2);
      await c.mintRange(...mintIntput);
      await c.setInitialHolders([account2.address]);
      const mintIntput2 = await c.getMintRangeInput(2);
      await c.mintRange(...mintIntput2);
      await c.setInitialHolders([account3.address]);
      const mintIntput3 = await c.getMintRangeInput(2);
      await c.mintRange(...mintIntput3);

      await c.pause();

      const rangeInput = await _getUpdateInitialHoldersRangeInput(c, 1, Infinity, [account4.address]);
      const tx = await c.updateInitialHoldersRange(...rangeInput);
      const receipt = await tx.wait();

      const empty = new Array(6).fill(0);

      const fromAddresses = rangeInput[0];
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
        else {
          expect(balancesAccount1[i]).to.equal(0);
          expect(balancesAccount2[i]).to.equal(0);
          expect(balancesAccount3[i]).to.equal(0);
          expect(balancesAccount4[i]).to.equal(i + 1);
        }
      }
    });

    it("should fail to update if unpaused between generating input and updating ", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(5);
      await c.mintRange(...mintIntput);
      await c.pause();
      const newInitialHolders = [account1.address, account3.address];
      const rangeInput = await _getUpdateInitialHoldersRangeInput(c, 0, 3, newInitialHolders);
      await c.unpause();
      await c.pause();

      await expect(c.updateInitialHoldersRange(...rangeInput)).to.be.rejected;
      
      const rangeInput2 = await _getUpdateInitialHoldersRangeInput(c, 0, 3, newInitialHolders);
      await expect(c.updateInitialHoldersRange(...rangeInput2)).to.not.be.rejected;
    });

  });

  describe("Lock initial holders", function() {
    it("should fail to lock initial holders of unminted tokens or if tokens are already locked", async function(){
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);

      await expect(c.setLockInitialHoldersUpTo(6)).to.be.rejectedWith("Unminted tokens.")
      
      const initialHolders = [account1.address, account2.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(5);
      await c.mintRange(...mintIntput);

      await expect(c.setLockInitialHoldersUpTo(7)).to.be.rejectedWith("Unminted tokens.")
      await expect(c.setLockInitialHoldersUpTo(4)).to.not.be.rejected;

      await expect(c.setLockInitialHoldersUpTo(4)).to.be.rejectedWith("Already locked.");
    });

    it("should fail to lock initial holders when paused", async function(){
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);      
      const initialHolders = [account1.address, account2.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(5);
      await c.mintRange(...mintIntput);
      await c.pause();
      await expect(c.setLockInitialHoldersUpTo(4)).to.be.rejectedWith("Pausable: paused");
    });

    it("should fail to create update initialHolders input when new holder is address(0)", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address];
      const initialHolders2 = [account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(5);
      await c.mintRange(...mintIntput);
      await c.pause();
      const newInitialHolders = [ethers.constants.AddressZero, account3.address];
      const newInitialHolders2 = [account1.address, ethers.constants.AddressZero];
      await expect(_getUpdateInitialHoldersRangeInput(c, 0, 3, newInitialHolders)).to.be.rejectedWith("E:16");
      await expect(_getUpdateInitialHoldersRangeInput(c, 4, 5, newInitialHolders2)).to.be.rejectedWith("E:16");
    });

    it("should fail to create update initialHolders input of locked range", async function () {
      const { c, account1, account2, account3, account4, } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address];
      const initialHolders2 = [account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(3);
      await c.mintRange(...mintIntput);
      await c.setInitialHolders(initialHolders2);
      const mintIntput2 = await c.getMintRangeInput(2);
      await c.mintRange(...mintIntput2);
      await c.setLockInitialHoldersUpTo(4);
      await c.pause();
      const newInitialHolders = [account1.address, account3.address];
      await expect(_getUpdateInitialHoldersRangeInput(c, 0, 3, newInitialHolders)).to.be.rejectedWith("E:15");
      await expect(_getUpdateInitialHoldersRangeInput(c, 4, 5, newInitialHolders)).to.be.rejectedWith("E:15");
      await expect(_getUpdateInitialHoldersRangeInput(c, 5, 5, newInitialHolders)).to.not.be.rejected;
    });


    it.skip("should fail to update initialHolders of locked range", async function () {
      // to test this comment-out the E:15 check in verifyUpdateInitialHolderRangeInput;
      const { c, account1, account2, account3, account4} = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address];
      const initialHolders2 = [account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const mintIntput = await c.getMintRangeInput(3);
      await c.mintRange(...mintIntput);
      await c.setInitialHolders(initialHolders2);
      const mintIntput2 = await c.getMintRangeInput(2);
      await c.mintRange(...mintIntput2);
      await c.setLockInitialHoldersUpTo(4);
      await c.pause();
      const newInitialHolders = [account1.address, account3.address];
      const inputs = await _getUpdateInitialHoldersRangeInput(c, 0, 3, newInitialHolders);
      await expect(c.updateInitialHoldersRange(...inputs)).to.be.rejectedWith("Error: Can't update locked initial holders.");
      const inputs2 = await _getUpdateInitialHoldersRangeInput(c, 4, 5, newInitialHolders);
      await expect(c.updateInitialHoldersRange(...inputs2)).to.be.rejectedWith("Error: Can't update locked initial holders.");
      const inputs3 = await _getUpdateInitialHoldersRangeInput(c, 5, 5, newInitialHolders);
      await expect(c.updateInitialHoldersRange(...inputs3)).to.not.be.rejected;
    });
  })
};
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractTransaction } from "ethers";
import _getUpdateInitialHolderRangesInput from "../scripts/_getUpdateInitialHolderRangesInput";
import { TestERC1155MintRange } from "../typechain-types";
import { deployFixture, Fixture } from "./fixture";
import integrityCheck from "./integrityCheck";
import verified from "./verified";

describe("ERC1155MintRange", function () {
  testERC1155MintRange(deployFixture("TestERC1155MintRange"));
});

export function testERC1155MintRange(deployFixture: () => Promise<Fixture<TestERC1155MintRange>>) {

  describe("getRangeMintInput", function () {

    it("Should return correctly formatted input params", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);

      const [input] = await c.getMintRangeInput(newTokens);
      const { ids, amounts } = input;

      expect(ids.length).to.equal(newTokens);
      for (let i = 0; i < newTokens; i++) {
        expect(ids[i].toNumber()).to.equal(i);
      }
      expect(amounts.length).to.equal(initialHolders.length);
      for (let i = 0; i < amounts.length; i++) {
        expect(amounts[i].length).to.equal(newTokens);
      }
    });

    it("Should return correctly formatted input params for 0 tokens", async function () {
      const newTokens = 0;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);

      const [input] = await c.getMintRangeInput(newTokens);
      const { ids, amounts } = input;

      expect(ids.length).to.equal(newTokens);
      for (let i = 0; i < newTokens; i++) {
        expect(ids[i].toNumber()).to.equal(i);
      }
      expect(amounts.length).to.equal(initialHolders.length);
      for (let i = 0; i < amounts.length; i++) {
        expect(amounts[i].length).to.equal(newTokens);
      }
    });

    it("Should return correctly formatted input params with consecutive ids when called after mintRange", async function () {
      const newTokens = 7;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const input = await c.getMintRangeInput(newTokens);
      await verified.mintRange(c, input[0]);

      const [input2] = await c.getMintRangeInput(newTokens);
      const { ids: ids2, amounts: amounts2 } = input2;

      expect(ids2.length).to.equal(newTokens);
      for (let i = 0; i < newTokens; i++) {
        expect(ids2[i].toNumber()).to.equal(i + newTokens);
      }
      expect(amounts2.length).to.equal(initialHolders.length);
      for (let i = 0; i < amounts2.length; i++) {
        expect(amounts2[i].length).to.equal(newTokens);
      }
    });

    it("Should correctly skip manually minted ids (_mint | _mintBatch)", async function () {
      const newTokens = 7;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);

      await verified.mintBatch(c, account1.address, [0, 1, 2, 3, 4, 5], [1, 1, 1, 1, 1, 1], []);
      await verified.mint(c, account1.address, 8, 8, []);

      const [input, checkSum] = await c.getMintRangeInput(newTokens);
      const { ids, amounts } = input;

      expect(ids.length).to.equal(newTokens);
      for (let i = 0; i < 6; i++) {
        expect(ids).to.not.include(i);
      }
      expect(ids).to.not.include(8);

      await verified.mintRange(c, input);
      await verified.mintBatch(c, account1.address, [15, 17], [1, 1], []);

      const [input2] = await c.getMintRangeInput(newTokens);
      const { ids: ids2 } = input2;

      expect(Number(ids[ids.length - 1]) + 1).to.equal(ids2[0]);

      expect(ids2.length).to.equal(newTokens);
      expect(ids2).to.not.include(15);
      expect(ids2).to.not.include(17);
    });

  });

  describe("mintRange", function () {
    it("Should mint 100 nfts to 4 initial holders and emit 4 TransferBatch events", async function () {
      const newTokens = 100;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const [inputs] = await c.getMintRangeInput(newTokens);
      const tx: ContractTransaction = await verified.mintRange(c, inputs);
      const receipt = await tx.wait();
      const transferEvents = receipt.events?.filter(e => e.event === "TransferBatch");

      const initialHoldersBalances = [];

      for (let i = 0; i < initialHolders.length; i++) {
        const addresses = new Array(newTokens).fill(initialHolders[i]);
        initialHoldersBalances.push(await c.balanceOfBatch(addresses, inputs[0]));
      }

      expect(transferEvents?.length).to.equal(initialHolders.length);
      expect(transferEvents?.length).to.equal(inputs[1].length);

      for (let i = 0; i < (transferEvents?.length ?? 0); i++) {
        const event = transferEvents?.[i]!;
        expect(inputs[1][i]).to.deep.equal(event.args?.[4]);
        expect(inputs[1][i]).to.deep.equal(initialHoldersBalances[i]);
      }
    });

    it("should correcly allocate dynamic balances when calling mintRange", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);

      await verified.mint(c, account1.address, 3, 1, []);
      const inputs = await c.getMintRangeInput(newTokens);
      await verified.mintRange(c, inputs[0]);
      const initialHolders2 = [account5.address, account6.address, account7.address, account8.address];
      await c.setInitialHolders(initialHolders2);
      const inputs2 = await c.getMintRangeInput(newTokens);
      await verified.mintRange(c, inputs2[0]);

      // ids 0-20 exist (21) 
      for (let i = 0; i <= 30; i++) {
        expect(await c.exists(i)).to.equal(i < 21);
      }

      const invalidBalances = await c.balanceOfBatch(initialHolders, [19, 20, 21, 22]);
      for (let i = 0; i < initialHolders.length; i++) {
        expect(invalidBalances[i].toNumber()).to.equal(0);
      }

      // token 0 has special handling in initialBalanceOf
      const balances0 = await c.balanceOfBatch(initialHolders, [0, 0, 0, 0]);
      for (let i = 0; i < initialHolders.length; i++) {
        expect(balances0[i].toNumber()).to.equal(9999);
      }

      // token 3 was minted manually
      const balances3 = await c.balanceOfBatch(initialHolders, [3, 3, 3, 3]);
      expect(balances3[0].toNumber()).to.equal(1);
      expect(balances3[1].toNumber()).to.equal(0);
      expect(balances3[2].toNumber()).to.equal(0);
      expect(balances3[3].toNumber()).to.equal(0);


      const balances2n = await c.balanceOfBatch([...initialHolders2, ...initialHolders2], [2, 3, 4, 5, 14, 15, 18, 19]);
      expect(balances2n[0].toNumber()).to.equal(0);
      expect(balances2n[1].toNumber()).to.equal(0);
      expect(balances2n[2].toNumber()).to.equal(0);
      expect(balances2n[3].toNumber()).to.equal(0);
      expect(balances2n[4].toNumber()).to.equal((14 % 10) + 1);
      expect(balances2n[5].toNumber()).to.equal((15 % 10) + 1);
      expect(balances2n[6].toNumber()).to.equal((18 % 10) + 1);
      expect(balances2n[7].toNumber()).to.equal((19 % 10) + 1);
    });

    it("should be possible to increase supply of dynamically minted tokens (_mintRange) via _mint|_mintBatch", async function () {
      const newTokens = 5;
      const { c, account1 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address];
      await c.setInitialHolders(initialHolders);
      const inputs = await c.getMintRangeInput(newTokens);
      await verified.mintRange(c, inputs[0]);

      const balances1 = await c.balanceOfBatch([account1.address, account1.address, account1.address, account1.address, account1.address], [1, 2, 3, 4, 5]);
      for (let i = 0; i < initialHolders.length; i++) {
        expect(balances1[i].toNumber()).to.equal((i + 1 % 10) + 1);
      }

      await verified.mint(c, account1.address, 1, 5, []);
      await verified.mintBatch(c, account1.address, [2, 3, 4, 5], [5, 5, 5, 5], []);

      const balances2 = await c.balanceOfBatch([account1.address, account1.address, account1.address, account1.address, account1.address], [1, 2, 3, 4, 5]);
      for (let i = 0; i < initialHolders.length; i++) {
        const balance = (i + 1 % 10) + 1 + 5;
        expect(balances2[i].toNumber()).to.equal(balance);
        expect(await c.totalSupply(i + 1)).to.equal(balance);
      }
    });

    it("mintRangeSafe Should fail when a token was minted since getMintRangeInput was called", async function () {
      const newTokens = 5;
      const { c, account1 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address];
      await c.setInitialHolders(initialHolders);

      const inputs = await c.getMintRangeInput(5);
      await verified.mint(c, account1.address, 1, 1, []);
      await expect(verified.mintRangeSafe(c, ...inputs)).to.be.rejectedWith("Invalid input. Use getMintRangeInput()");


      const integrity = await integrityCheck(c).ids(initialHolders, [1])
      const balances = await integrity.balances();
      const supplies = await integrity.supplies();

      await c.mintRange(inputs[0]);

      await balances.expectEqual();
      await supplies.expectEqual();

    });


    it("mintRangeSafe Should fail when a batch of tokens was minted since getMintRangeInput was called", async function () {
      const newTokens = 5;
      const { c, account1 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address];
      await c.setInitialHolders(initialHolders);

      const inputs = await c.getMintRangeInput(5);
      await verified.mintBatch(c, account1.address, [20, 21], [1, 1], []);
      await expect(verified.mintRangeSafe(c, ...inputs)).to.be.rejectedWith("Invalid input. Use getMintRangeInput()");


      const integrity = await integrityCheck(c).ids(initialHolders, [20, 21])
      const balances = await integrity.balances();
      const supplies = await integrity.supplies();

      await expect(verified.mintRange(c, inputs[0])).to.not.be.rejected;

      await balances.expectEqual();
      await supplies.expectEqual();
    });

    it("mintRangeSafe should fail when initial holders were updated since getMintRangeInput was called", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      const newTokens = 5;
      const initialHolders1 = [account1.address];
      const initialHolders2 = [account2.address];
      await c.setInitialHolders(initialHolders1);

      const inputs = await c.getMintRangeInput(5);
      await c.setInitialHolders(initialHolders2);
      await expect(verified.mintRangeSafe(c, ...inputs)).to.be.rejectedWith("Invalid input. Use getMintRangeInput()");

      // should not affect initialHolders1
      const integrity = await integrityCheck(c).range(initialHolders1, 0, 4);
      // should correcly mint for initialHolder2
      const transfers = await integrityCheck(c).transfersMintRange(initialHolders2, inputs[0]);

      const balances = await integrity.balances([[0, 0, 0, 0, 0]]);
      await integrity.supplies([0, 0, 0, 0, 0]);

      const tx = await verified.mintRange(c, inputs[0]);

      await balances.expectEqual()
      await integrity.supplies([9999, 2, 3, 4, 5]);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });
    });

    it("mintRangeSafe should fail when another mintRange was executed since getMintRangeInput was called", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address];
      await c.setInitialHolders(initialHolders);

      const inputs = await c.getMintRangeInput(5);

      await expect(verified.mintRangeSafe(c, ...inputs)).to.not.be.rejected;
      await expect(verified.mintRangeSafe(c, ...inputs)).to.be.rejected;

      const integrity = await integrityCheck(c).range(initialHolders, 0, 4)
      const balances = await integrity.balances();
      const supplies = await integrity.supplies();

      await expect(c.mintRange(inputs[0])).to.not.be.rejected;

      await balances.expectEqual();
      await supplies.expectEqual();
    });

  });

  describe("safeTransfer(Batch)", function () {

    it("should transfer existing tokens that are minted with mintRange", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const inputs = await c.getMintRangeInput(newTokens);
      await verified.mintRange(c, inputs[0]);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9999)

      await verified.connect(account1).safeTransferFrom(c, account1.address, account5.address, 0, 999, []);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9000)
      expect(await c.balanceOf(account5.address, 0)).to.equal(999)

      await verified.connect(account5).safeTransferFrom(c, account5.address, account1.address, 0, 9, []);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9009)
      expect(await c.balanceOf(account5.address, 0)).to.equal(990)

    });

    it("should batch transfer existing tokens that are minted with mintRange", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const inputs = await c.getMintRangeInput(newTokens);
      await verified.mintRange(c, inputs[0]);
      expect(await c.balanceOf(account1.address, 0)).to.equal(9999)
      expect(await c.balanceOf(account1.address, 1)).to.equal(2)
      expect(await c.balanceOf(account1.address, 2)).to.equal(3)

      expect(await c.balanceOf(account5.address, 0)).to.equal(0)
      expect(await c.balanceOf(account5.address, 1)).to.equal(0)
      expect(await c.balanceOf(account5.address, 2)).to.equal(0)

      await verified.connect(account1).safeBatchTransferFrom(c, account1.address, account5.address, [0, 1, 2], [1, 1, 1], []);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9998)
      expect(await c.balanceOf(account1.address, 1)).to.equal(1)
      expect(await c.balanceOf(account1.address, 2)).to.equal(2)

      expect(await c.balanceOf(account5.address, 0)).to.equal(1)
      expect(await c.balanceOf(account5.address, 1)).to.equal(1)
      expect(await c.balanceOf(account5.address, 2)).to.equal(1)
    });
  });

  describe("initialHolders", function () {
    it("Should return current initial holders when called with tokenID > number tokens minted", async function () {
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      const initialHolders2 = [account5.address, account6.address, account7.address, account8.address];

      await c.setInitialHolders(initialHolders);

      expect(await c.initialHolders(1000)).to.deep.equal(initialHolders);

      const inputs = await c.getMintRangeInput(5);
      await verified.mintRange(c, inputs[0]);
      await c.setInitialHolders(initialHolders2);
      expect(await c.initialHolders(1000)).to.deep.equal(initialHolders2);
    });

    it("Should return initial holders for tokenId (also after they where updated)", async function () {
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      const initialHolders2 = [account5.address, account6.address, account7.address, account8.address];

      await c.setInitialHolders(initialHolders);

      const inputs = await c.getMintRangeInput(5);
      await verified.mintRange(c, inputs[0]);
      await c.setInitialHolders(initialHolders2);
      const inputs2 = await c.getMintRangeInput(5);
      await verified.mintRange(c, inputs2[0]);
      expect(await c.initialHolders(1000)).to.deep.equal(initialHolders2);

      for (let i = 0; i < 10; i++) {
        if (i < 5) {
          const currInitialHolders = await c.initialHolders(i);
          expect(currInitialHolders).to.deep.equal(initialHolders);
          for (let h = 0; h < initialHolders.length; h++) {
            expect(currInitialHolders).to.include(initialHolders[h]);
            expect(currInitialHolders).to.not.include(initialHolders2[h]);
          }
        }
        else {
          const currInitialHolders = await c.initialHolders(i);
          expect(currInitialHolders).to.deep.equal(initialHolders2);
          for (let h = 0; h < initialHolders2.length; h++) {
            expect(currInitialHolders).to.not.include(initialHolders[h]);
            expect(currInitialHolders).to.include(initialHolders2[h]);
          }
        }
      }
    });
  });

  describe("totalSupply", function () {
    it("should correcly track totalSupply for dynamic balances minted with mintRange", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);

      await verified.mint(c, account1.address, 3, 1, []);

      const inputs = await c.getMintRangeInput(newTokens);

      await verified.mintRange(c, inputs[0]);

      expect(await c.totalSupply(0)).to.equal(9999 * initialHolders.length);
      expect(await c.totalSupply(3)).to.equal(1);

      for (let i = 0; i < newTokens; i++) {
        if (i !== 3 && i !== 0) {
          const dynamicSupply = (i % 10) + 1;
          expect(await c.totalSupply(i)).to.equal(dynamicSupply * initialHolders.length);
        }
      }
    });

    it("should correcly track totalSupply for manually mints with _mint & _mintBatch ", async function () {
      const { c, account1, account2 } = await loadFixture(deployFixture);

      let transfers = await integrityCheck(c).transferSingle(ethers.constants.AddressZero, account1.address, 2, 1);
      let tx = await verified.mint(c, account1.address, 2, 1, []);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });


      transfers = await integrityCheck(c).transferSingle(ethers.constants.AddressZero, account1.address, 3, 1);
      tx = await verified.mint(c, account1.address, 3, 1, []);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });

      transfers = await integrityCheck(c).transferBatch(ethers.constants.AddressZero, account1.address, [3, 4, 5], [2, 2, 2]);
      tx = await verified.mintBatch(c, account1.address, [3, 4, 5], [2, 2, 2], []);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });


      transfers = await integrityCheck(c).transferSingle(ethers.constants.AddressZero, account2.address, 2, 1);
      tx = await verified.mint(c, account2.address, 2, 1, []);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });

      transfers = await integrityCheck(c).transferSingle(ethers.constants.AddressZero, account2.address, 3, 1);
      tx = await verified.mint(c, account2.address, 3, 1, []);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });

      transfers = await integrityCheck(c).transferBatch(ethers.constants.AddressZero, account2.address, [3, 4, 5], [2, 2, 2]);
      tx = await verified.mintBatch(c, account2.address, [3, 4, 5], [2, 2, 2], []);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });

      expect(await c.totalSupply(0)).to.equal(0);
      expect(await c.totalSupply(1)).to.equal(0);
      expect(await c.totalSupply(2)).to.equal(2);
      expect(await c.totalSupply(3)).to.equal(6);
      expect(await c.totalSupply(4)).to.equal(4);
      expect(await c.totalSupply(5)).to.equal(4);
    });

    it("should correcly track totalSupply when supply is added to dynamic balances ", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);

      const inputs = await c.getMintRangeInput(newTokens);

      let transfers = await integrityCheck(c).transfersMintRange(initialHolders, inputs[0]);
      let tx = await verified.mintRange(c, inputs[0]);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });

      transfers = await integrityCheck(c).transferSingle(ethers.constants.AddressZero, account1.address, 0, 30);
      tx = await verified.mint(c, account1.address, 0, 30, []);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });

      transfers = await integrityCheck(c).transferSingle(ethers.constants.AddressZero, account2.address, 0, 30);
      tx = await verified.mint(c, account2.address, 0, 30, []);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });

      expect(await c.totalSupply(0)).to.equal(9999 * initialHolders.length + 60);

      transfers = await integrityCheck(c).transferBatch(ethers.constants.AddressZero, account3.address, [1, 2, 3, 4, 5, 6, 7, 8, 9], [3, 3, 3, 3, 3, 3, 3, 3, 3]);
      tx = await verified.mintBatch(c, account3.address, [1, 2, 3, 4, 5, 6, 7, 8, 9], [3, 3, 3, 3, 3, 3, 3, 3, 3], []);
      await transfers.expectSuccess(tx, { expectSupplyChange: true });

      for (let i = 0; i < newTokens; i++) {
        if (i !== 0) {
          const dynamicSupply = (i % 10) + 1;
          expect(await c.totalSupply(i)).to.equal(dynamicSupply * initialHolders.length + 3);
        }
      }

    });

    it("should correcly track totalSupply when supply is removed / burned ", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);

      const inputs = await c.getMintRangeInput(newTokens);
      await verified.mintRange(c, inputs[0]);

      await c.burn(account1.address, 0, 30);
      await c.burn(account2.address, 0, 30);

      expect(await c.totalSupply(0)).to.equal(9999 * initialHolders.length - 60);

      await c.burnBatch(account3.address, [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 1, 1, 1, 1, 1, 1, 1, 1]);

      for (let i = 0; i < newTokens; i++) {
        if (i !== 0) {
          const dynamicSupply = (i % 10) + 1;
          expect(await c.totalSupply(i)).to.equal(dynamicSupply * initialHolders.length - 1);
        }
      }
    });
  });
}
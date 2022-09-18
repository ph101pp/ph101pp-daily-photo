import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, assert } from "chai";
import { ethers } from "hardhat";

describe("ERC1155DynamicInitialBalances", function () {

  async function deployFixture() {
    // Contracts are deplodyed using the first signer/account by default
    const [owner, account1, account2, account3, account4, account5, account6, account7, account8] = await ethers.getSigners();

    const C = await ethers.getContractFactory("ERC1155DynamicInitialBalancesTestContract");
    const c = await C.deploy();

    return { c, owner, account1, account2, account3, account4, account5, account6, account7, account8 };
  }

  describe("getRangeMintInput", function () {
    it("Should fail if no initialHolders are set", async function () {
      const { c } = await loadFixture(deployFixture);

      await expect(
        c.getMintRangeInput(10)
      ).to.revertedWith("No initial holders set. Use _setInitialHolders()");
    });

    it("Should return correctly formatted input params", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const [addresses, ids, amounts] = await c.getMintRangeInput(newTokens);

      expect(addresses.length).to.equal(initialHolders.length);
      for (let i = 0; i < addresses.length; i++) {
        expect(addresses[i]).to.equal(initialHolders[i]);
      }
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
      await c.mintRange(...input);
      const [addresses2, ids2, amounts2] = await c.getMintRangeInput(newTokens);

      expect(addresses2.length).to.equal(initialHolders.length);
      for (let i = 0; i < addresses2.length; i++) {
        expect(addresses2[i]).to.equal(initialHolders[i]);
      }
      expect(ids2.length).to.equal(newTokens);
      for (let i = 0; i < newTokens; i++) {
        expect(ids2[i].toNumber()).to.equal(i + newTokens);
      }
      expect(amounts2.length).to.equal(initialHolders.length);
      for (let i = 0; i < amounts2.length; i++) {
        expect(amounts2[i].length).to.equal(newTokens);
      }
    });
  });

  describe("mintRange", function () {
    it("Should mint 100 nfts to 4 initial holders and emit 4 TransferBatch events", async function () {
      const newTokens = 100;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const [addresses, ids, amounts] = await c.getMintRangeInput(newTokens);
      const tx = await c.mintRange(addresses, ids, amounts);
      const receipt = await tx.wait();

      expect(receipt.events?.filter(e => e.event === "TransferBatch").length).to.equal(initialHolders.length);

    });

    it("should correcly allocate dynamic balances when calling mintRange", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const inputs = await c.getMintRangeInput(newTokens);
      await c.mintRange(...inputs);
      const initialHolders2 = [account5.address, account6.address, account7.address, account8.address];
      await c.setInitialHolders(initialHolders2);
      const inputs2 = await c.getMintRangeInput(newTokens);
      await c.mintRange(...inputs2);

      for (let i = 0; i <=30; i++) {
        expect(await c.exists(i)).to.equal(i<20);
      }

      const invalidBalances = await c.balanceOfBatch(initialHolders, [20, 21, 22, 23]);
      for (let i = 0; i < initialHolders.length; i++) {
        expect(invalidBalances[i].toNumber()).to.equal(0);
      }

      const balances0 = await c.balanceOfBatch(initialHolders, [0, 0, 0, 0]);
      for (let i = 0; i < initialHolders.length; i++) {
        expect(balances0[i].toNumber()).to.equal(9999);
      }

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
  });

  describe("safeTransfer(Batch)", function () {
    it("should transfer existing tokens that are minted with mintRange", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const inputs = await c.getMintRangeInput(newTokens);
      await c.mintRange(...inputs);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9999)

      await c.connect(account1).safeTransferFrom(account1.address, account5.address, 0, 999, []);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9000)
      expect(await c.balanceOf(account5.address, 0)).to.equal(999)

      await c.connect(account5).safeTransferFrom( account5.address, account1.address, 0, 9, []);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9009)
      expect(await c.balanceOf(account5.address, 0)).to.equal(990)

    });

    it("should batch transfer existing tokens that are minted with mintRange", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      const inputs = await c.getMintRangeInput(newTokens);
      await c.mintRange(...inputs);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9999)
      expect(await c.balanceOf(account1.address, 1)).to.equal(2)
      expect(await c.balanceOf(account1.address, 2)).to.equal(3)

      expect(await c.balanceOf(account5.address, 0)).to.equal(0)
      expect(await c.balanceOf(account5.address, 1)).to.equal(0)
      expect(await c.balanceOf(account5.address, 2)).to.equal(0)

      await c.connect(account1).safeBatchTransferFrom(account1.address, account5.address, [0, 1, 2], [1,1,1], []);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9998)
      expect(await c.balanceOf(account1.address, 1)).to.equal(1)
      expect(await c.balanceOf(account1.address, 2)).to.equal(2)      
      
      expect(await c.balanceOf(account5.address, 0)).to.equal(1)
      expect(await c.balanceOf(account5.address, 1)).to.equal(1)
      expect(await c.balanceOf(account5.address, 2)).to.equal(1)
    });
  });

  describe("burn(Batch)", function () {
  });

  describe("mint(Batch)", function () {
  });

  describe("initialHolders", function () {
  });

});
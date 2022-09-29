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
      const [ids, amounts] = await c.getMintRangeInput(newTokens);

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
      const [ids2, amounts2] = await c.getMintRangeInput(newTokens);

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

      await c.mintBatch(account1.address, [0, 1, 2, 3, 4, 5], [1, 1, 1, 1, 1, 1], []);
      await c.mint(account1.address, 8, 8, []);

      const [ids, amounts, checkSum] = await c.getMintRangeInput(newTokens);

      expect(ids.length).to.equal(newTokens);
      for (let i = 0; i < 6; i++) {
        expect(ids).to.not.include(i);
      }
      expect(ids).to.not.include(8);

      await c.mintRange(ids, amounts, checkSum);
      await c.mintBatch(account1.address, [15, 17], [1, 1], []);

      const [ids2] = await c.getMintRangeInput(newTokens);
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
      const inputs = await c.getMintRangeInput(newTokens);
      const tx = await c.mintRange(...inputs);
      const receipt = await tx.wait();

      expect(receipt.events?.filter(e => e.event === "TransferBatch").length).to.equal(initialHolders.length);

    });

    it("should correcly allocate dynamic balances when calling mintRange", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);

      await c.mint(account1.address, 3, 1, []);

      const inputs = await c.getMintRangeInput(newTokens);
      await c.mintRange(...inputs);
      const initialHolders2 = [account5.address, account6.address, account7.address, account8.address];
      await c.setInitialHolders(initialHolders2);
      const inputs2 = await c.getMintRangeInput(newTokens);
      await c.mintRange(...inputs2);

      // ids 0-20 exist (21) 
      for (let i = 0; i <= 30; i++) {
        expect(await c.exists(i)).to.equal(i < 21);
      }

      const invalidBalances = await c.balanceOfBatch(initialHolders, [20, 21, 22, 23]);
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

      await c.connect(account5).safeTransferFrom(account5.address, account1.address, 0, 9, []);

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

      await c.connect(account1).safeBatchTransferFrom(account1.address, account5.address, [0, 1, 2], [1, 1, 1], []);

      expect(await c.balanceOf(account1.address, 0)).to.equal(9998)
      expect(await c.balanceOf(account1.address, 1)).to.equal(1)
      expect(await c.balanceOf(account1.address, 2)).to.equal(2)

      expect(await c.balanceOf(account5.address, 0)).to.equal(1)
      expect(await c.balanceOf(account5.address, 1)).to.equal(1)
      expect(await c.balanceOf(account5.address, 2)).to.equal(1)
    });
  });

  describe("initialHolders", function () {
    it("Should return current initial holders when called without params", async function () {
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      const initialHolders2 = [account5.address, account6.address, account7.address, account8.address];

      await expect(c["initialHolders()"]()).to.be.revertedWith("No initial holders set. Use _setInitialHolders()");

      await c.setInitialHolders(initialHolders);

      expect(await c["initialHolders()"]()).to.deep.equal(initialHolders);

      const inputs = await c.getMintRangeInput(5);
      await c.mintRange(...inputs);
      await c.setInitialHolders(initialHolders2);
      expect(await c["initialHolders()"]()).to.deep.equal(initialHolders2);
    });

    it("Should return initial holders for tokenId (also after they where updated)", async function () {
      const { c, account1, account2, account3, account4, account5, account6, account7, account8 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      const initialHolders2 = [account5.address, account6.address, account7.address, account8.address];

      await c.setInitialHolders(initialHolders);

      const inputs = await c.getMintRangeInput(5);
      await c.mintRange(...inputs);
      await c.setInitialHolders(initialHolders2);
      expect(await c["initialHolders()"]()).to.deep.equal(initialHolders2);

      expect(await c["initialHolders(uint256)"](0)).to.deep.equal(initialHolders);
      expect(await c["initialHolders(uint256)"](1)).to.deep.equal(initialHolders);
      expect(await c["initialHolders(uint256)"](2)).to.deep.equal(initialHolders);
      expect(await c["initialHolders(uint256)"](3)).to.deep.equal(initialHolders);
      expect(await c["initialHolders(uint256)"](4)).to.deep.equal(initialHolders);
    });
  });

  describe("totalSupply", function () {
    it("should correcly track totalSupply for dynamic balances minted with mintRange", async function () {
      const newTokens = 10;
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);

      await c.mint(account1.address, 3, 1, []);

      const inputs = await c.getMintRangeInput(newTokens);
      await c.mintRange(...inputs);

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

      await c.mint(account1.address, 2, 1, []);
      await c.mint(account1.address, 3, 1, []);
      await c.mintBatch(account1.address, [3, 4, 5], [2, 2, 2], []);

      await c.mint(account2.address, 2, 1, []);
      await c.mint(account2.address, 3, 1, []);
      await c.mintBatch(account2.address, [3, 4, 5], [2, 2, 2], []);

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
      await c.mintRange(...inputs);

      c.mint(account1.address, 0, 30, []);
      c.mint(account2.address, 0, 30, []);

      expect(await c.totalSupply(0)).to.equal(9999 * initialHolders.length + 60);

      c.mintBatch(account3.address, [1, 2, 3, 4, 5, 6, 7, 8, 9], [3, 3, 3, 3, 3, 3, 3, 3, 3], []);
      
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
      await c.mintRange(...inputs);

      await c.burn(account1.address, 0, 30);
      await c.burn(account2.address, 0, 30);

      expect(await c.totalSupply(0)).to.equal(9999 * initialHolders.length - 60);

      await c.burnBatch(account3.address, [1, 2, 3, 4, 5, 6, 7, 8, 9], [1,1,1,1,1,1,1,1,1]);
      
      for (let i = 0; i < newTokens; i++) {
        if (i !== 0) {
          const dynamicSupply = (i % 10) + 1;
          expect(await c.totalSupply(i)).to.equal(dynamicSupply * initialHolders.length - 1);
        }
      }
    });
  });
});
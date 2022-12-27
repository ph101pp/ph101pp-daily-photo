import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import _getUpdateInitialHoldersInputSafe from "../scripts/_getUpdateInitialHoldersInput";
import { testERC1155MintRange } from "./ERC1155MintRange";
import { TestERC1155MintRangePausable } from "../typechain-types";
import { deployFixture, Fixture } from "./fixture";

describe("ERC1155MintRangePausable", function () {
  testERC1155MintRange(deployFixture("TestERC1155MintRangePausable"));
  testERC1155MintRangePausable(deployFixture("TestERC1155MintRangePausable"));
});

export function testERC1155MintRangePausable(deployFixture: ()=>Promise<Fixture<TestERC1155MintRangePausable>>) {

  describe("Pausable (when paused)", function () {
    it("should fail to mintRange()", async function () {
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.setInitialHolders(initialHolders);
      await c.pause();
      const inputs = await c.getMintRangeInput(10);
      await expect(c.mintRange(...inputs)).to.be.rejectedWith("Pausable: paused");
    });

    it("should fail to setInitialHolders()", async function () {
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      const initialHolders = [account1.address, account2.address, account3.address, account4.address];
      await c.pause();
      await expect(c.setInitialHolders(initialHolders)).to.be.rejectedWith("Pausable: paused");
    });

    it("should fail to mint()", async function () {
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      await c.pause();
      await expect(c.mint(account1.address, 2, 1, [])).to.be.rejectedWith("Pausable: paused");
    });

    it("should fail to mintBatch()", async function () {
      const { c, account1 } = await loadFixture(deployFixture);
      await c.pause();
      await expect(c.mintBatch(account1.address, [3, 4, 5], [2, 2, 2], [])).to.be.rejectedWith("Pausable: paused");
    });

    it("should fail to burn()", async function () {
      const { c, account1 } = await loadFixture(deployFixture);
      await c.pause();
      await expect(c.burn(account1.address, 2, 1)).to.be.rejectedWith("Pausable: paused");
    });

    it("should fail to transfer()", async function () {
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      await c.mint(account1.address, 2, 1, []);
      await c.pause();
      await expect(c.connect(account1).safeTransferFrom(account1.address, account2.address, 2, 1, [])).to.be.rejectedWith("Pausable: paused");
    });

    it("should fail to transferBatch()", async function () {
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);
      await c.mintBatch(account1.address, [3, 4, 5], [2, 2, 2], []);
      await c.pause();
      await expect(c.connect(account1).safeBatchTransferFrom(account1.address, account2.address, [3, 4, 5], [2, 2, 2], [])).to.be.rejectedWith("Pausable: paused");
    });
  });
}
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { ContractTransaction } from "ethers";

const interations = 100;
async function cost(tx: Promise<ContractTransaction>): Promise<number> {
  const receipt = await (await tx).wait();
  return receipt.cumulativeGasUsed.toNumber() / 100;
}

describe.only("Gas costs ERC1155 vs ERC1155MintRange vs ERC1155MintRangeUpdateable", function () {
  async function deployFixture() {
    const mutableUri = "mutable_.uri/";
    const immutableUri = "immutable.uri/";
    // Contracts are deplodyed using the first signer/account by default
    const [owner, treasury, vault, account1, account2, account3, account4] = await ethers.getSigners();

    const ERC = await ethers.getContractFactory("TestERC1155");
    const erc = await ERC.deploy();

    const PDP = await ethers.getContractFactory("Ph101ppDailyPhoto");
    const pdp = await PDP.deploy(mutableUri, immutableUri, treasury.address, vault.address);

    const C1 = await ethers.getContractFactory("TestERC1155MintRange");
    const c1 = await C1.deploy();

    const C2 = await ethers.getContractFactory("TestERC1155MintRangeUpdateable");
    const c2 = await C2.deploy();


    return { erc, c1, c2, pdp, owner, treasury, vault, mutableUri, immutableUri, account1, account2, account3, account4 };
  }

  it("mint() transfer() burn()", async function () {
    const { erc, c1, c2, account1, account2 } = await loadFixture(deployFixture);

    const report = {
      mint: {
        TestERC1155: 0,
        TestERC1155MintRange: 0,
        TestERC1155MintRangeUpdateable: 0
      },
      safeTransferFrom: {
        TestERC1155: 0,
        TestERC1155MintRange: 0,
        TestERC1155MintRangeUpdateable: 0
      },
      burn: {
        TestERC1155: 0,
        TestERC1155MintRange: 0,
        TestERC1155MintRangeUpdateable: 0
      }
    };

    for (let i = 0; i < interations; i++) {
      report.mint.TestERC1155 += await cost(erc.mint(account1.address, i, 10, []));
      report.mint.TestERC1155MintRange += await cost(c1.mint(account1.address, i, 10, []));
      report.mint.TestERC1155MintRangeUpdateable += await cost(c2.mint(account1.address, i, 10, []));
    }

    for (let i = 0; i < interations; i++) {
      report.safeTransferFrom.TestERC1155 += await cost(erc.connect(account1).safeTransferFrom(account1.address, account2.address, i, 10, []));
      report.safeTransferFrom.TestERC1155MintRange += await cost(c1.connect(account1).safeTransferFrom(account1.address, account2.address, i, 10, []));
      report.safeTransferFrom.TestERC1155MintRangeUpdateable += await cost(c2.connect(account1).safeTransferFrom(account1.address, account2.address, i, 10, []));
    }

    for (let i = 0; i < interations; i++) {
      report.burn.TestERC1155 += await cost(erc.connect(account2).burn(account2.address, i, 10));
      report.burn.TestERC1155MintRange += await cost(c1.connect(account2).burn(account2.address, i, 10));
      report.burn.TestERC1155MintRangeUpdateable += await cost(c2.connect(account2).burn(account2.address, i, 10));
    }

    console.log(report);
  });

  it("mintBatch() transferBatch() burnBatch()", async function () {
    const { erc, c1, c2, account1, account2 } = await loadFixture(deployFixture);
    const batchSize = 10;

    const report = {
      mintBatch: {
        TestERC1155: 0,
        TestERC1155MintRange: 0,
        TestERC1155MintRangeUpdateable: 0
      },
      safeBatchTransferFrom: {
        TestERC1155: 0,
        TestERC1155MintRange: 0,
        TestERC1155MintRangeUpdateable: 0
      },
      burnBatch: {
        TestERC1155: 0,
        TestERC1155MintRange: 0,
        TestERC1155MintRangeUpdateable: 0
      }
    };

    for (let i = 0; i < interations; i++) {
      report.mintBatch.TestERC1155 += await cost(erc.mintBatch(account1.address, new Array(batchSize).fill(0).map((_, j) => j + i), new Array(batchSize).fill(10), []));
      report.mintBatch.TestERC1155MintRange += await cost(c1.mintBatch(account1.address, new Array(batchSize).fill(0).map((_, j) => j + i), new Array(batchSize).fill(10), []));
      report.mintBatch.TestERC1155MintRangeUpdateable += await cost(c2.mintBatch(account1.address, new Array(batchSize).fill(0).map((_, j) => j + i), new Array(batchSize).fill(10), []));
    }

    for (let i = 0; i < interations; i++) {
      report.safeBatchTransferFrom.TestERC1155 += await cost(erc.connect(account1).safeBatchTransferFrom(account1.address, account2.address, new Array(batchSize).fill(0).map((_, j) => j + i), new Array(batchSize).fill(10), []));
      report.safeBatchTransferFrom.TestERC1155MintRange += await cost(c1.connect(account1).safeBatchTransferFrom(account1.address, account2.address, new Array(batchSize).fill(0).map((_, j) => j + i), new Array(batchSize).fill(10), []));
      report.safeBatchTransferFrom.TestERC1155MintRangeUpdateable += await cost(c2.connect(account1).safeBatchTransferFrom(account1.address, account2.address, new Array(batchSize).fill(0).map((_, j) => j + i), new Array(batchSize).fill(10), []));
    }

    for (let i = 0; i < interations; i++) {
      report.burnBatch.TestERC1155 += await cost(erc.burnBatch(account2.address, new Array(batchSize).fill(0).map((_, j) => j + i), new Array(batchSize).fill(10)));
      report.burnBatch.TestERC1155MintRange += await cost(c1.burnBatch(account2.address, new Array(batchSize).fill(0).map((_, j) => j + i), new Array(batchSize).fill(10)));
      report.burnBatch.TestERC1155MintRangeUpdateable += await cost(c2.burnBatch(account2.address, new Array(batchSize).fill(0).map((_, j) => j + i), new Array(batchSize).fill(10)));
    }
    console.log(report);
  });

  it("pause() unpause()", async function () {
    const { erc, c1, c2, account1, account2 } = await loadFixture(deployFixture);

    const report = {
      pause: {
        TestERC1155: 0,
        TestERC1155MintRangeUpdateable: 0
      },
      unpause: {
        TestERC1155: 0,
        TestERC1155MintRangeUpdateable: 0
      }
    }

    for (let i = 0; i < interations; i++) {
      report.pause.TestERC1155 += await cost(erc.pause());
      report.unpause.TestERC1155 += await cost(erc.unpause());
      report.pause.TestERC1155MintRangeUpdateable += await cost(c2.pause());
      report.unpause.TestERC1155MintRangeUpdateable += await cost(c2.unpause());
    }

    console.log(report);
  });

  it.only("mintRange() transfer() transfer()", async function () {
    const { erc, c1, c2, account1, account2 } = await loadFixture(deployFixture);

    await c1.setInitialHolders([account1.address]);
    await c2.setInitialHolders([account1.address]);

    const input1 = await c1.getMintRangeInput(100);
    await c1.mintRange(...input1);
    const input2 = await c2.getMintRangeInput(100);
    await c2.mintRange(...input2);

    for (let i = 0; i < interations; i++) {
      erc.mint(account1.address, i, 1, []);
    }

    const report = {
      safeTransferFrom1: {
        TestERC1155: 0,
        TestERC1155MintRange: 0,
        TestERC1155MintRangeUpdateable: 0
      },
      safeTransferFrom2: {
        TestERC1155: 0,
        TestERC1155MintRange: 0,
        TestERC1155MintRangeUpdateable: 0
      }
    }

    for (let i = 0; i < interations; i++) {
      report.safeTransferFrom1.TestERC1155 += await cost(erc.connect(account1).safeTransferFrom(account1.address, account2.address, i, 1, []));
      report.safeTransferFrom1.TestERC1155MintRange += await cost(c1.connect(account1).safeTransferFrom(account1.address, account2.address, i, 1, []));
      report.safeTransferFrom1.TestERC1155MintRangeUpdateable += await cost(c2.connect(account1).safeTransferFrom(account1.address, account2.address, i, 1, []));
    }

    for (let i = 0; i < interations; i++) {
      report.safeTransferFrom2.TestERC1155 += await cost(erc.connect(account2).safeTransferFrom(account2.address, account1.address, i, 1, []));
      report.safeTransferFrom2.TestERC1155MintRange += await cost(c1.connect(account2).safeTransferFrom(account2.address, account1.address, i, 1, []));
      report.safeTransferFrom2.TestERC1155MintRangeUpdateable += await cost(c2.connect(account2).safeTransferFrom(account2.address, account1.address, i, 1, []));
    }

    console.log(report);
  });

});
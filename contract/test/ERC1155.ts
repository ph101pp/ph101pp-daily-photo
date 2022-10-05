import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, assert } from "chai";
import { ethers } from "hardhat";
import getPh101ppDailyPhotoUpdateInitialHoldersRangeInput from "../scripts/getPh101ppDailyPhotoUpdateInitialHoldersRangeInput";
import { Ph101ppDailyPhoto } from "../typechain-types";

const SECONDS_PER_DAY = 24 * 60 * 60;
const nowTimestamp = Math.ceil(Date.now()/1000)+SECONDS_PER_DAY*3;

describe.skip("ERC1155 vs ERC1155MintRange", function () {
  async function deployFixture() {
    const mutableUri = "mutable_.uri/";
    const immutableUri = "immutable.uri/";
    // Contracts are deplodyed using the first signer/account by default
    const [owner, treasury, vault, account1, account2] = await ethers.getSigners();
    const latest = await time.latest();
    
    if(latest < nowTimestamp) {
      await time.increaseTo(nowTimestamp);
    }

    const PDP = await ethers.getContractFactory("Ph101ppDailyPhoto");
    const pdp = await PDP.deploy(mutableUri, immutableUri, treasury.address, vault.address);

    return {pdp, owner, treasury, vault, mutableUri, immutableUri, account1, account2};
  }

  describe("Gas consumption over time", function(){

    it("should not increase gas when called multiple times: setProxyURI ", async function () {
      const { pdp, mutableUri } = await loadFixture(deployFixture);

      for(let i=0; i<1000; i++) {
        await pdp.setProxyURI(mutableUri+i);
      }
    });

    it("should not increase gas when called multiple times: setPermanentURI ", async function () {
      const { pdp, immutableUri } = await loadFixture(deployFixture);

      for(let i=0; i<1000; i++) {
        await pdp.setPermanentURI(immutableUri+i, i);
      }
    });
  });
})
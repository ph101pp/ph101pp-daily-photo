import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { Ph101ppDailyPhotos } from "../typechain-types";

const SECONDS_PER_DAY = 24 * 60 * 60;
const nowTimestamp = Math.ceil(Date.now()/1000)+SECONDS_PER_DAY*3;

describe("Ph101ppDailyPhotos", function () {

  async function deployFixture() {
    const mutableUri = "mutable.uri/";
    const immutableUri = "immutable.uri/";
    // Contracts are deplodyed using the first signer/account by default
    const [owner, treasury, vault] = await ethers.getSigners();
    const latest = await time.latest();
    
    if(latest < nowTimestamp) {
      await time.increaseTo(nowTimestamp);
    }
    const PDPTokenId = await ethers.getContractFactory("Ph101ppDailyPhotosTokenId");
    const pdpTokenId = await PDPTokenId.deploy();

    const PDP = await ethers.getContractFactory("Ph101ppDailyPhotos", {
      libraries: {
        Ph101ppDailyPhotosTokenId: pdpTokenId.address,
      },
    });
    const pdp = await PDP.deploy(immutableUri, mutableUri, [treasury.address, vault.address]);

    return {pdp, owner, treasury, vault, mutableUri, immutableUri};
  }

  describe("URI storing / updating", function () {
    it("Should set the correct mutableUri and immutableUri during deploy", async function () {
      const { pdp, mutableUri, immutableUri } = await loadFixture(deployFixture);
      expect(await pdp.mutableBaseUri()).to.equal(mutableUri);
      expect(await pdp.baseUri()).to.equal(immutableUri);
    });

    it("Should correcly update mutableUri via setMutableURI()", async function () {
      const mutableUri2 = "2.mutable.uri";
      const { pdp, mutableUri } = await loadFixture(deployFixture);
      expect(await pdp.mutableBaseUri()).to.equal(mutableUri);
      await pdp.setMutableURI(mutableUri2);
      expect(await pdp.mutableBaseUri()).to.equal(mutableUri2);
    });
    
    it("Should correcly update immutableUri via setURI() and fire event", async function () {
      const immutableUri2 = "2.immutable.uri";
      const { pdp, immutableUri, owner } = await loadFixture(deployFixture);
      expect(await pdp.baseUri()).to.equal(immutableUri);
      const tx = await pdp.setURI(immutableUri2);
      const receipt = await tx.wait();
      expect(await pdp.baseUri()).to.equal(immutableUri2);
      const uriSetEvents = receipt.events?.filter((x) => {return x.event == "UriSet"});
      assert(uriSetEvents?.length === 1);
      expect(uriSetEvents[0].args?.newURI).to.equal(immutableUri2);
      expect(uriSetEvents[0].args?.sender).to.equal(owner.address);
    });
  });

  describe("tokenID <> date conversion", function(){
    type TokenIdTest = {
      tokenID: number,
      year: number,
      month: number,
      day: number
    }

    const tokenIDTests: TokenIdTest[] = [
      {
        tokenID: 1,
        year: 2022,
        month: 9,
        day: 1
      },
      {
        tokenID: 20,
        year: 2022,
        month: 9,
        day: 20
      },
      {
        tokenID: 524,
        year: 2024,
        month: 2,
        day: 6
      },
      {
        tokenID: 5824,
        year: 2038,
        month: 8,
        day: 11
      },
      {
        tokenID: 15824,
        year: 2065,
        month: 12,
        day: 27
      },
      {
        tokenID: 99999,
        year: 2296,
        month: 6,
        day: 14
      }
    ]

    async function testDate2TokenID(pdp: Ph101ppDailyPhotos, test:TokenIdTest) {
      const [year, month, day] = await pdp.tokenIdToDate(test.tokenID);
      const tokenId = await pdp.tokenIdFromDate(test.year, test.month, test.day);
          
      expect(year).to.equal(test.year);
      expect(month).to.equal(test.month);
      expect(day).to.equal(test.day);
      assert(tokenId.eq(test.tokenID), `${tokenId.toString()} === ${test.tokenID}`)
    }

    it("should correcty convert date string <> token ID", async function () {
      const { pdp } = await loadFixture(deployFixture);

      for(const i in tokenIDTests) {
        await testDate2TokenID(pdp, tokenIDTests[i]);
      }
    });

    it("should fail to translate tokenID:0 (claims) to date", async function () {
      const { pdp } = await loadFixture(deployFixture);
      await expect(
        pdp.tokenIdToDate(0)
      ).to.be.revertedWith('No date associated with claims!');
    });

    it("should fail to translate date before Sept 1, 2022 to tokenId", async function () {
      const { pdp } = await loadFixture(deployFixture);
      await expect(
        pdp.tokenIdFromDate(2022,8,1)
      ).to.be.revertedWith('Project started September 1, 2022!');
    });

    it("should fail to translate date if invalid date (incl leap years)", async function () {
      const { pdp } = await loadFixture(deployFixture);
      await expect(
        pdp.tokenIdFromDate(5138,13,17)
      ).to.be.revertedWith('Invalid date!');
      await expect(
        pdp.tokenIdFromDate(2023,2,29)
      ).to.be.revertedWith('Invalid date!');
      await expect(
        pdp.tokenIdFromDate(2025,2,29)
      ).to.be.revertedWith('Invalid date!');
      assert(
        await pdp.tokenIdFromDate(2024,2,29),
      "20240229 should be valid date");
    });
  });

  describe("URI() for tokenIDs", function(){

    it("should return correct url for tokenId:1 ", async function () {
      const tokenId = 1;
      const year = 2022;
      const month = 9;
      const day = 1;
      const tokenDate = `${year}${month<=9?"0":""}${month}${day<=9?"0":""}${day}`

      const { pdp, immutableUri } = await loadFixture(deployFixture);

      expect(await pdp.uri(tokenId)).to.equal(immutableUri+tokenDate+".json");
    });

    it("should return correct url for tokenId:0 (CLAIM) ", async function () {
      const tokenId = 0;
      const { pdp, immutableUri } = await loadFixture(deployFixture);
      expect(await pdp.uri(tokenId)).to.equal(immutableUri+"CLAIM.json");
    });

    it("should return correct url for yesterdays tokenId ", async function () {
      const { pdp, immutableUri } = await loadFixture(deployFixture);
      const now = new Date(nowTimestamp*1000);
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth()+1;
      const day = now.getUTCDate()-1;

      const tokenId = await pdp.tokenIdFromDate(year, month, day);
      const tokenDate = `${year}${month<=9?"0":""}${month}${day<=9?"0":""}${day}`

      expect(await pdp.uri(tokenId)).to.equal(immutableUri+tokenDate+".json");
    });
    
    it("should return correct url for todays tokenId ", async function () {
      const { pdp, mutableUri } = await loadFixture(deployFixture);
      const now = new Date(nowTimestamp*1000);
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth()+1;
      const day = now.getUTCDate();

      const tokenId = await pdp.tokenIdFromDate(year, month, day);
      const tokenDate = `${year}${month<=9?"0":""}${month}${day<=9?"0":""}${day}`

      expect(await pdp.uri(tokenId)).to.equal(mutableUri+tokenDate+".json");
    });

    it("should return correct url for tomorrows tokenId ", async function () {
      const { pdp, immutableUri } = await loadFixture(deployFixture);
      const now = new Date(nowTimestamp*1000);
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth()+1;
      const day = now.getUTCDate()+1;

      const tokenId = await pdp.tokenIdFromDate(year, month, day);

      expect(await pdp.uri(tokenId)).to.equal(immutableUri+"FUTURE.json");
    });

    it("should return correct url for a minted token before and after immutableURI was updated", async function () {
      const { pdp, mutableUri } = await loadFixture(deployFixture);
      const newImmutableUri = "2.immutable.uri/";

      time.increase(60*60*24*7);
      
      const now = new Date(nowTimestamp*1000);
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth()+1;
      const day = now.getUTCDate()+3;
      const tokenDate = `${year}${month<=9?"0":""}${month}${day<=9?"0":""}${day}`

      const tokenId = await pdp.tokenIdFromDate(year, month, day);
      
      expect(await pdp.uri(tokenId)).to.equal(mutableUri+tokenDate+".json");

      await pdp.setURI(newImmutableUri);

      expect(await pdp.uri(tokenId)).to.equal(newImmutableUri+tokenDate+".json");

    });

  });

  describe.skip("Mint Photos", function(){
    it("should mint 1 photo vault wallet ", async function () {
      const { pdp, vault, treasury } = await loadFixture(deployFixture);
      const photos = 2000;
      const [addresses, ids, amounts] = await pdp.getMintRangeInput(photos);
      
      const tx = await pdp.mintPhotos(addresses, ids, amounts);

      const receipt = await tx.wait();
      // const balances = await pdp.balanceOfBatch(addresses, ids);

      console.log(receipt);
    });
  })

  describe.skip("Claim tokens", function(){
    it("should mint 10 claim tokens to treasury wallet ", async function () {
      const { pdp, treasury, vault } = await loadFixture(deployFixture);
      expect(await pdp.balanceOf(treasury.address, 0)).to.equal(10);
      expect(await pdp.balanceOf(vault.address, 0)).to.equal(0);
    });
  });

  describe.skip("Gas consumption over time", function(){

    it("should not increase gas when called multiple times: setMutableURI ", async function () {
      const { pdp, mutableUri } = await loadFixture(deployFixture);

      for(let i=0; i<1000; i++) {
        await pdp.setMutableURI(mutableUri+i);
      }
    });

    it("should not increase gas when called multiple times: setURI ", async function () {
      const { pdp, immutableUri } = await loadFixture(deployFixture);

      for(let i=0; i<1000; i++) {
        await pdp.setURI(immutableUri+i);
      }
    });
  });

});


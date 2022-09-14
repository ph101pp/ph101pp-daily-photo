import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { Ph101ppDailyPhotos } from "../typechain-types";

const SECONDS_PER_DAY = 24 * 60 * 60;
const nowTimestamp = Math.ceil(Date.now()/1000)+SECONDS_PER_DAY*3;

describe.only("Ph101ppDailyPhotos", function () {

  async function deployFixture() {
    const mutableUri = "mutable.uri/";
    const immutableUri = "immutable.uri/";
    // Contracts are deplodyed using the first signer/account by default
    const [owner, account1, account2] = await ethers.getSigners();
    
    await time.increaseTo(nowTimestamp);
    
    const PDP = await ethers.getContractFactory("Ph101ppDailyPhotos");
    const pdp = await PDP.deploy(immutableUri, mutableUri);

    return {pdp, owner, account1, account2, mutableUri, immutableUri};
  }

  describe("URI storing / updating", function () {
    it("Should set the correct mutableUri and immutableUri during deploy", async function () {
      const { pdp, mutableUri, immutableUri } = await loadFixture(deployFixture);
      expect(await pdp.mutableUri()).to.equal(mutableUri);
      const uriHistory = await pdp.uriHistory();
      expect(uriHistory).to.be.lengthOf(1);
      expect(uriHistory[0]).to.equal(immutableUri);
    });

    it("Should correcly update mutableUri via setMutableURI()", async function () {
      const mutableUri2 = "2.mutable.uri";
      const { pdp, mutableUri } = await loadFixture(deployFixture);
      expect(await pdp.mutableUri()).to.equal(mutableUri);
      await pdp.setMutableURI(mutableUri2);
      expect(await pdp.mutableUri()).to.equal(mutableUri2);
    });
    
    it("Should correcly append immutableUri via setURI()", async function () {
      const immutableUri2 = "2.immutable.uri";
      const { pdp, immutableUri } = await loadFixture(deployFixture);
      await pdp.setURI(immutableUri2);
      const uriHistory = await pdp.uriHistory();
      expect(uriHistory).to.be.lengthOf(2);
      expect(uriHistory[0]).to.equal(immutableUri);
      expect(uriHistory[1]).to.equal(immutableUri2);
    });
  });

  describe("tokenID <> date conversion", function(){
    type TokenIdTest = {
      tokenID: number,
      date: string,
    }

    const tokenIDTests: TokenIdTest[] = [
      {
        tokenID: 1,
        date: "20220901"
      },
      {
        tokenID: 20,
        date: "20220920"
      },
      {
        tokenID: 524,
        date: "20240206"
      },
      {
        tokenID: 5824,
        date: "20380811"
      },
      {
        tokenID: 15824,
        date: "20651227"
      },
      {
        tokenID: 99999,
        date: "22960614"
      }
    ]

    async function testDate2TokenID(pdp: Ph101ppDailyPhotos, test:TokenIdTest) {
      const dateString = await pdp.tokenIdToDate(test.tokenID);

      const year = parseInt(test.date.slice(0,4));
      const month = parseInt(test.date.slice(4,6));
      const day = parseInt(test.date.slice(6,8));
      const tokenId = await pdp.tokenIdFromDate(year, month, day);
            
      expect(dateString).to.equal(test.date);
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

      const uri = await pdp.uri(tokenId);
      const uriForDate = await pdp.uriForDate(year, month, day);
      
      expect(uri).to.equal(immutableUri+tokenDate+".json");
      expect(uri).to.equal(uriForDate);
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

      const uri = await pdp.uri(tokenId);
      const uriForDate = await pdp.uriForDate(year, month, day);
      
      expect(uri).to.equal(immutableUri+tokenDate+".json");
      expect(uri).to.equal(uriForDate);
    });
    
    it("should return correct url for todays tokenId ", async function () {
      const { pdp, mutableUri } = await loadFixture(deployFixture);
      const now = new Date(nowTimestamp*1000);
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth()+1;
      const day = now.getUTCDate();

      const tokenId = await pdp.tokenIdFromDate(year, month, day);
      const tokenDate = `${year}${month<=9?"0":""}${month}${day<=9?"0":""}${day}`

      const uri = await pdp.uri(tokenId);
      const uriForDate = await pdp.uriForDate(year, month, day);
      
      expect(uri).to.equal(mutableUri+tokenDate+".json");
      expect(uri).to.equal(uriForDate);
    });

    it("should return correct url for tomorrows tokenId ", async function () {
      const { pdp, immutableUri } = await loadFixture(deployFixture);
      const now = new Date(nowTimestamp*1000);
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth()+1;
      const day = now.getUTCDate()+1;

      const tokenId = await pdp.tokenIdFromDate(year, month, day);

      const uri = await pdp.uri(tokenId);
      const uriForDate = await pdp.uriForDate(year, month, day);
      
      expect(uri).to.equal(immutableUri+"FUTURE.json");
      expect(uri).to.equal(uriForDate);

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

      const uri = await pdp.uri(tokenId);
      const uriForDate = await pdp.uriForDate(year, month, day);
      
      expect(uri).to.equal(mutableUri+tokenDate+".json");
      expect(uri).to.equal(uriForDate);

      await pdp.setURI(newImmutableUri);

      const uri2 = await pdp.uri(tokenId);
      const uriForDate2 = await pdp.uriForDate(year, month, day);
      
      expect(uri2).to.equal(newImmutableUri+tokenDate+".json");
      expect(uri2).to.equal(uriForDate2);

    });

  });

});


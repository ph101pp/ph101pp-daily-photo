import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect, assert } from "chai";
import { ethers } from "hardhat";
import getPh101ppDailyPhotoUpdateInitialHoldersRangeInput from "../scripts/getPh101ppDailyPhotoUpdateInitialHoldersRangeInput";
import { Ph101ppDailyPhoto } from "../typechain-types";

const SECONDS_PER_DAY = 24 * 60 * 60;
const nowTimestamp = Math.ceil(Date.now()/1000)+SECONDS_PER_DAY*3;

describe("Ph101ppDailyPhoto", function () {

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

  describe("URI storing / updating", function () {
    it("Should set the correct mutableUri and immutableUri during deploy", async function () {
      const { pdp, mutableUri, immutableUri } = await loadFixture(deployFixture);
      expect(await pdp.proxyBaseUri()).to.equal(mutableUri);
      expect(await pdp.permanentBaseUri()).to.equal(immutableUri);
    });

    it("Should correcly update mutableUri via setProxyURI()", async function () {
      const mutableUri2 = "2.mutable.uri";
      const { pdp, mutableUri } = await loadFixture(deployFixture);
      expect(await pdp.proxyBaseUri()).to.equal(mutableUri);
      await pdp.setProxyURI(mutableUri2);
      expect(await pdp.proxyBaseUri()).to.equal(mutableUri2);
    });
    
    it("Should correcly update immutableUri via setPermanentURI() and permanentBaseUriHistory to reflect this.", async function () {
      const immutableUri2 = "2.immutable.uri";
      const immutableUri3 = "3.immutable.uri";
      const { pdp, immutableUri } = await loadFixture(deployFixture);
      expect(await pdp.permanentBaseUri()).to.equal(immutableUri);
      await pdp.setPermanentURI(immutableUri2, 100);
      expect(await pdp.permanentBaseUri()).to.equal(immutableUri2);
      
      const history = await pdp.permanentBaseUriHistory();
      expect(history.length).to.equal(2);
      expect(history[0]).to.equal(immutableUri);
      expect(history[1]).to.equal(immutableUri2);
      
      await pdp.setPermanentURI(immutableUri3, 101);
      
      const histor2 = await pdp.permanentBaseUriHistory();
      expect(histor2.length).to.equal(3);
      expect(histor2[0]).to.equal(immutableUri);
      expect(histor2[1]).to.equal(immutableUri2);
      expect(histor2[2]).to.equal(immutableUri3);
    });

    it("Should require new permanentUri via setPermanentURI() to be valid for more tokenIds than the last one.", async function () {
      const immutableUri2 = "2.immutable.uri";
      const immutableUri3 = "3.immutable.uri";
      const { pdp, owner } = await loadFixture(deployFixture);
      const tx = await pdp.setPermanentURI(immutableUri2, 100);
      await expect(pdp.setPermanentURI(immutableUri3, 100)).to.be.revertedWith("Error: URI must be valid for more tokenIds than previous URI.");
      await pdp.setPermanentURI(immutableUri3, 101);
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

    async function testDate2TokenID(pdp: Ph101ppDailyPhoto, test:TokenIdTest) {
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
      ).to.be.revertedWith('Invalid date! Project started September 1, 2022!');
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

    it("should return correct url for unminted tokenId:1 ", async function () {
      const tokenId = 1;
      const year = 2022;
      const month = 9;
      const day = 1;
      const tokenDate = `${year}${month<=9?"0":""}${month}${day<=9?"0":""}${day}`

      const { pdp, mutableUri } = await loadFixture(deployFixture);

      expect(await pdp.uri(tokenId)).to.equal(mutableUri+tokenDate+".json");
    });

    it("should return correct url for tokenId:0 (CLAIM) ", async function () {
      const tokenId = 0;
      const { pdp, immutableUri } = await loadFixture(deployFixture);
      expect(await pdp.uri(tokenId)).to.equal(immutableUri+"CLAIM.json");
    });

    it("should return mutable url for all unminted nfts ", async function () {
      const { pdp, mutableUri, immutableUri } = await loadFixture(deployFixture);
      await pdp.setPermanentURI(immutableUri, 100);

      for(let i=1; i<100; i++) {
        expect(await pdp.uri(i)).to.include(mutableUri);
      }
    });

    it("should return immutable url for all minted nfts ", async function () {
      const { pdp, mutableUri,immutableUri } = await loadFixture(deployFixture);
      await pdp.setPermanentURI(immutableUri, 100);
      const inputs = await pdp.getMintRangeInput(50);
      await pdp.mintPhotos(...inputs, 5);

      for(let i=1; i<100; i++) {
        if(i>50) expect(await pdp.uri(i)).to.include(mutableUri);
        else expect(await pdp.uri(i)).to.include(immutableUri);
      }
    });

    it("should return mutable url for minted nfts after _uriValidUptoTokenId", async function () {
      const { pdp, mutableUri,immutableUri } = await loadFixture(deployFixture);
      await pdp.setPermanentURI(immutableUri, 10);
      const inputs = await pdp.getMintRangeInput(50);
      await pdp.mintPhotos(...inputs, 5);

      for(let i=1; i<50; i++) {
        if(i>10) expect(await pdp.uri(i)).to.include(mutableUri);
        else expect(await pdp.uri(i)).to.include(immutableUri);
      }
    });
  });

  describe("Mint Photos", function(){
    it("should mint 1 vault and up to max supply to treasury ", async function () {
      const { pdp, vault, treasury } = await loadFixture(deployFixture);
      const photos = 1000;
      const maxSupply = 5;
      const input = await pdp.getMintRangeInput(photos);
      
      const vaultAddresses = new Array(photos).fill(vault.address);
      const treasuryAddresses = new Array(photos).fill(treasury.address);

      await pdp.mintPhotos(...input, maxSupply);
      const ids = input[0];
      const vaultBalances = await pdp.balanceOfBatch(vaultAddresses, ids);
      const treasuryBalances = await pdp.balanceOfBatch(treasuryAddresses, ids);

      const balanceDistribution: {[key:number] : number} = {};
      
      for(let i = 0; i<photos; i++){
        expect(vaultBalances[i]).to.equal(1);
        balanceDistribution[treasuryBalances[i].toNumber()] = balanceDistribution[treasuryBalances[i].toNumber()]??0;
        balanceDistribution[treasuryBalances[i].toNumber()]++;
      }
      expect(balanceDistribution[0]).to.equal(undefined);
      for(let i = 1; i<maxSupply; i++) {
        expect(balanceDistribution[i]).to.be.gt(0.8*photos/maxSupply);
      }
    });

  })

  describe("Claim tokens", function(){
    it("should mint 10 claim tokens to treasury wallet ", async function () {
      const { pdp, treasury, vault } = await loadFixture(deployFixture);
      expect(await pdp.balanceOf(treasury.address, 0)).to.equal(10);
      expect(await pdp.balanceOf(vault.address, 0)).to.equal(0);
    });

    it("should mint claim tokens to any wallet ", async function () {
      const { pdp, treasury, account1 } = await loadFixture(deployFixture);

      await pdp.mintClaims(account1.address, 2);
      
      expect(await pdp.totalSupply(0)).to.equal(12);
      expect(await pdp.balanceOf(treasury.address, 0)).to.equal(10);
      expect(await pdp.balanceOf(account1.address, 0)).to.equal(2);

    });

    it("should claim mints from treasury and burn claims when redeemClaimBatch is called", async function () {

      const { pdp, treasury, vault, account1, account2 } = await loadFixture(deployFixture);
      
      const input1 = await pdp.getMintRangeInput(5);
      await pdp.mintPhotos(...input1, 1);

      const newTreasury = account2.address
      await pdp.setInitialHolders(newTreasury, vault.address);

      const input2 = await pdp.getMintRangeInput(5);
      await pdp.mintPhotos(...input2, 1);

      await pdp.connect(treasury).safeTransferFrom(treasury.address, account1.address, 0, 2, []);
      
      expect(await pdp.balanceOf(account1.address, 0)).to.equal(2);

      await expect(pdp.connect(account1).redeemClaimBatch([8, 9, 7], [1, 1, 1])).to.be.rejected;
      await expect(pdp.connect(account1).redeemClaimBatch([8], [1, 1])).to.be.rejected;
      await expect(pdp.connect(account1).redeemClaimBatch([8, 9], [1])).to.be.rejected;
      await expect(pdp.connect(account1).redeemClaimBatch([8, 2], [1, 1])).to.be.rejectedWith("Can't batch claim tokens from multiple treasury wallets.");
      await pdp.connect(account1).redeemClaimBatch([4, 2], [1, 1]);

      expect(await pdp.balanceOf(account1.address, 0)).to.equal(0);
      expect(await pdp.balanceOf(account1.address, 2)).to.equal(1);
      expect(await pdp.balanceOf(account1.address, 4)).to.equal(1);

      expect(await pdp.balanceOf(treasury.address, 2)).to.equal(0);
      expect(await pdp.balanceOf(treasury.address, 4)).to.equal(0);
    });

    it("should claim mint from treasury and burn claim when redeemClaim is called", async function () {

      const { pdp, treasury, vault, account1, account2 } = await loadFixture(deployFixture);
      
      const input1 = await pdp.getMintRangeInput(5);
      await pdp.mintPhotos(...input1, 1);

      const newTreasury = account2.address
      await pdp.setInitialHolders(newTreasury, vault.address);

      const input2 = await pdp.getMintRangeInput(5);
      await pdp.mintPhotos(...input2, 1);

      await pdp.connect(treasury).safeTransferFrom(treasury.address, account1.address, 0, 2, []);
      
      expect(await pdp.balanceOf(account1.address, 0)).to.equal(2);

      await pdp.connect(account1).redeemClaim(8);
      await pdp.connect(account1).redeemClaim(2);

      expect(await pdp.balanceOf(account1.address, 0)).to.equal(0);
      expect(await pdp.balanceOf(account1.address, 2)).to.equal(1);
      expect(await pdp.balanceOf(account1.address, 8)).to.equal(1);

      expect(await pdp.balanceOf(treasury.address, 2)).to.equal(0);
      expect(await pdp.balanceOf(newTreasury, 8)).to.equal(0);
    });

  });

  describe("Update initial holders / getPh101ppDailyPhotoUpdateInitialHoldersRangeInput", function(){
    it("should correcly update vault address only", async function () {
      const { pdp, vault, treasury, account1 } = await loadFixture(deployFixture);
      const photos = 10;
      const maxSupply = 5;
      const input = await pdp.getMintRangeInput(photos);
      
      const vaultAddresses = new Array(photos).fill(vault.address);
      const treasuryAddresses = new Array(photos).fill(treasury.address);

      await pdp.mintPhotos(...input, maxSupply);
      const ids = input[0];
      const vaultBalances = await pdp.balanceOfBatch(vaultAddresses, ids);
      const treasuryBalances = await pdp.balanceOfBatch(treasuryAddresses, ids);

      for(let i = 0; i<photos; i++){
        expect(vaultBalances[i]).to.equal(1);
        expect(treasuryBalances[i]).to.gte(1);
      }

      await pdp.pause();
      const updateInitialHoldersInput = await getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(pdp, 0, Infinity, treasury.address, account1.address);
      const tx = await pdp.updateInitialHoldersRange(...updateInitialHoldersInput);
      const receipt = await tx.wait();

      const newVaultAddresses = new Array(photos).fill(account1.address);
      const newTreasuryBalances = await pdp.balanceOfBatch(treasuryAddresses, ids);
      const newVaultBalances = await pdp.balanceOfBatch(newVaultAddresses, ids);
      const newOldVaultBalances = await pdp.balanceOfBatch(vaultAddresses, ids);
      
      for(let i = 0; i<photos; i++){
        expect(newVaultBalances[i]).to.equal(1);
        expect(newOldVaultBalances[i]).to.equal(0);
        expect(treasuryBalances[i]).to.equal(newTreasuryBalances[i]);
      }
      
      expect(receipt.events?.filter(e => e.event === "TransferBatch").length).to.equal(1);
      expect(receipt.events?.filter(e => e.args?.from && e.args?.to && e.args?.from === e.args?.to).length).to.equal(0);
    });

    it("should correcly update treasury address only", async function () {
      const { pdp, vault, treasury, account1 } = await loadFixture(deployFixture);
      const photos = 10;
      const maxSupply = 5;
      const input = await pdp.getMintRangeInput(photos);
      
      const vaultAddresses = new Array(photos).fill(vault.address);
      const treasuryAddresses = new Array(photos).fill(treasury.address);

      await pdp.mintPhotos(...input, maxSupply);
      const ids = input[0];
      const vaultBalances = await pdp.balanceOfBatch(vaultAddresses, ids);
      const treasuryBalances = await pdp.balanceOfBatch(treasuryAddresses, ids);

      for(let i = 0; i<photos; i++){
        expect(vaultBalances[i]).to.equal(1);
        expect(treasuryBalances[i]).to.gte(1);
      }

      await pdp.pause();
      const updateInitialHoldersInput = await getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(pdp, 0, Infinity, account1.address, vault.address);
      const tx = await pdp.updateInitialHoldersRange(...updateInitialHoldersInput);
      const receipt = await tx.wait();

      const newTreasuryAddresses = new Array(photos).fill(account1.address);
      const newTreasuryBalances = await pdp.balanceOfBatch(newTreasuryAddresses, ids);
      const newOldTreasuryBalances = await pdp.balanceOfBatch(treasuryAddresses, ids);
      const newVaultBalances = await pdp.balanceOfBatch(vaultAddresses, ids);
      
      for(let i = 0; i<photos; i++){
        expect(newVaultBalances[i]).to.equal(1);
        expect(newOldTreasuryBalances[i]).to.equal(0);
        expect(treasuryBalances[i]).to.equal(newTreasuryBalances[i]);
      }
      
      expect(receipt.events?.filter(e => e.event === "TransferBatch").length).to.equal(1);
      expect(receipt.events?.filter(e => e.args?.from && e.args?.to && e.args?.from === e.args?.to).length).to.equal(0);
    });

    it("should correcly swap treasury and vault addresses", async function () {
      const { pdp, vault, treasury } = await loadFixture(deployFixture);
      const photos = 10;
      const maxSupply = 5;
      const input = await pdp.getMintRangeInput(photos);
      
      const vaultAddresses = new Array(photos).fill(vault.address);
      const treasuryAddresses = new Array(photos).fill(treasury.address);

      await pdp.mintPhotos(...input, maxSupply);
      const ids = input[0];
      const vaultBalances = await pdp.balanceOfBatch(vaultAddresses, ids);
      const treasuryBalances = await pdp.balanceOfBatch(treasuryAddresses, ids);

      for(let i = 0; i<photos; i++){
        expect(vaultBalances[i]).to.equal(1);
        expect(treasuryBalances[i]).to.gte(1);
      }

      await pdp.pause();
      const updateInitialHoldersInput = await getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(pdp, 0, Infinity, vault.address, treasury.address);
      
      await pdp.updateInitialHoldersRange(...updateInitialHoldersInput);

      const newTreasuryBalances = await pdp.balanceOfBatch(vaultAddresses, ids);
      const newVaultBalances = await pdp.balanceOfBatch(treasuryAddresses, ids);

      for(let i = 0; i<photos; i++){
        expect(newVaultBalances[i]).to.equal(vaultBalances[i]);
        expect(newTreasuryBalances[i]).to.equal(treasuryBalances[i]);
      }
    });
  });

  describe.skip("Gas consumption over time", function(){

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

});


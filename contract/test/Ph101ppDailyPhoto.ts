import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { EtherscanConfig } from "@nomiclabs/hardhat-etherscan/dist/src/types";
import { expect, assert } from "chai";
import { ethers } from "hardhat";
import getPh101ppDailyPhotoUpdateInitialHoldersRangeInput from "../scripts/getPh101ppDailyPhotoUpdateInitialHoldersRangeInput";
import { Ph101ppDailyPhoto } from "../typechain-types";
import { testERC1155MintRangeUpdateable } from "./ERC1155MintRangeUpdateable";
import { Fixture, SignerWithAddress } from "./fixture";

const SECONDS_PER_DAY = 24 * 60 * 60;
const nowTimestamp = Math.ceil(Date.now() / 1000) + SECONDS_PER_DAY * 3;

type FixturePDP = {
  treasury: SignerWithAddress,
  vault: SignerWithAddress,
  mutableUri: string,
  immutableUri: string,
}
describe("Ph101ppDailyPhoto", function () {
  testPh101ppDailyPhoto(deployFixture("Ph101ppDailyPhoto"));
});

function deployFixture<T>(contractName: string): () => Promise<Fixture<T> & FixturePDP> {
  const mutableUri = "mutable_.uri/";
  const immutableUri = "immutable.uri/";
  
  return async function fixture() {
    // Contracts are deplodyed using the first signer/account by default
    const [owner, treasury, vault, account1, account2, account3, account4, account5, account6, account7, account8] = await ethers.getSigners();
    const latest = await time.latest();

    if (latest < nowTimestamp) {
      await time.increaseTo(nowTimestamp);
    }

    const PDP = await ethers.getContractFactory(contractName);
    const c = await PDP.deploy(mutableUri, immutableUri, treasury.address, vault.address) as T;

    return { c, owner, treasury, vault, mutableUri, immutableUri, account1, account2, account3, account4, account5, account6, account7, account8 };
  }
}


export function testPh101ppDailyPhoto(deployFixture: () => Promise<Fixture<Ph101ppDailyPhoto> & FixturePDP>) {

  describe("URI storing / updating", function () {
    it("Should set the correct mutableUri and immutableUri during deploy", async function () {
      const { c, mutableUri, immutableUri } = await loadFixture(deployFixture);
      expect(await c.proxyBaseUri()).to.equal(mutableUri);
      expect(await c.permanentBaseUri()).to.equal(immutableUri);
    });

    it("Should correcly update mutableUri via setProxyBaseUri()", async function () {
      const mutableUri2 = "2.mutable.uri";
      const { c, mutableUri } = await loadFixture(deployFixture);
      expect(await c.proxyBaseUri()).to.equal(mutableUri);
      await c.setProxyBaseUri(mutableUri2);
      expect(await c.proxyBaseUri()).to.equal(mutableUri2);
    });

    it("Should correcly update immutableUri via setPermanentBaseUriUpTo() and permanentBaseUriHistory to reflect this.", async function () {
      const immutableUri2 = "2.immutable.uri";
      const immutableUri3 = "3.immutable.uri";
      const { c, immutableUri } = await loadFixture(deployFixture);
      expect(await c.permanentBaseUri()).to.equal(immutableUri);
      await c.setPermanentBaseUriUpTo(immutableUri2, 100);
      expect(await c.permanentBaseUri()).to.equal(immutableUri2);

      const history = await c.permanentBaseUriHistory();
      expect(history.length).to.equal(2);
      expect(history[0]).to.equal(immutableUri);
      expect(history[1]).to.equal(immutableUri2);

      await c.setPermanentBaseUriUpTo(immutableUri3, 101);

      const histor2 = await c.permanentBaseUriHistory();
      expect(histor2.length).to.equal(3);
      expect(histor2[0]).to.equal(immutableUri);
      expect(histor2[1]).to.equal(immutableUri2);
      expect(histor2[2]).to.equal(immutableUri3);
    });

    it("Should require new permanentUri via setPermanentBaseUriUpTo() to be valid for more tokenIds than the last one.", async function () {
      const immutableUri2 = "2.immutable.uri";
      const immutableUri3 = "3.immutable.uri";
      const { c, owner } = await loadFixture(deployFixture);
      const tx = await c.setPermanentBaseUriUpTo(immutableUri2, 100);
      await expect(c.setPermanentBaseUriUpTo(immutableUri3, 100)).to.be.revertedWith("Error: TokenId must be larger than lastTokenIdWithValidPermanentUri.");
      await c.setPermanentBaseUriUpTo(immutableUri3, 101);
    });
  });

  describe("tokenID <> date conversion", function () {
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

    async function testDate2TokenID(c: Ph101ppDailyPhoto, test: TokenIdTest) {
      const [year, month, day] = await c.tokenIdToDate(test.tokenID);
      const tokenId = await c.tokenIdFromDate(test.year, test.month, test.day);

      expect(year).to.equal(test.year);
      expect(month).to.equal(test.month);
      expect(day).to.equal(test.day);
      assert(tokenId.eq(test.tokenID), `${tokenId.toString()} === ${test.tokenID}`)
    }

    it("should correcty convert date string <> token ID", async function () {
      const { c } = await loadFixture(deployFixture);

      for (const i in tokenIDTests) {
        await testDate2TokenID(c, tokenIDTests[i]);
      }
    });

    it("should fail to translate tokenID:0 (claims) to date", async function () {
      const { c } = await loadFixture(deployFixture);
      await expect(
        c.tokenIdToDate(0)
      ).to.be.revertedWith('No date associated with claims!');
    });

    it("should fail to translate date before Sept 1, 2022 to tokenId", async function () {
      const { c } = await loadFixture(deployFixture);
      await expect(
        c.tokenIdFromDate(2022, 8, 1)
      ).to.be.revertedWith('Invalid date! Project started September 1, 2022!');
    });

    it("should fail to translate date if invalid date (incl leap years)", async function () {
      const { c } = await loadFixture(deployFixture);
      await expect(
        c.tokenIdFromDate(5138, 13, 17)
      ).to.be.revertedWith('Invalid date!');
      await expect(
        c.tokenIdFromDate(2023, 2, 29)
      ).to.be.revertedWith('Invalid date!');
      await expect(
        c.tokenIdFromDate(2025, 2, 29)
      ).to.be.revertedWith('Invalid date!');
      assert(
        await c.tokenIdFromDate(2024, 2, 29),
        "20240229 should be valid date");
    });
  });

  describe("URI() for tokenIDs", function () {

    it("should return correct url for unminted tokenId:1 ", async function () {
      const tokenId = 1;
      const year = 2022;
      const month = 9;
      const day = 1;
      const tokenDate = `${year}${month <= 9 ? "0" : ""}${month}${day <= 9 ? "0" : ""}${day}`

      const { c, mutableUri } = await loadFixture(deployFixture);

      expect(await c.uri(tokenId)).to.equal(mutableUri + tokenDate + ".json");
    });

    it("should return correct url for tokenId:0 (CLAIM) ", async function () {
      const tokenId = 0;
      const { c, immutableUri } = await loadFixture(deployFixture);
      expect(await c.uri(tokenId)).to.equal(immutableUri + "CLAIM.json");
    });

    it("should return mutable url for all unminted nfts ", async function () {
      const { c, mutableUri, immutableUri } = await loadFixture(deployFixture);
      await c.setPermanentBaseUriUpTo(immutableUri, 100);

      for (let i = 1; i < 100; i++) {
        expect(await c.uri(i)).to.include(mutableUri);
      }
    });

    it("should return immutable url for all minted nfts ", async function () {
      const { c, mutableUri, immutableUri } = await loadFixture(deployFixture);
      await c.setPermanentBaseUriUpTo(immutableUri, 100);
      await c.setMaxInitialSupply(5);
      const inputs = await c.getMintRangeInput(50);
      await c.mintPhotos(...inputs);

      for (let i = 1; i < 100; i++) {
        if (i > 50) expect(await c.uri(i)).to.include(mutableUri);
        else expect(await c.uri(i)).to.include(immutableUri);
      }
    });

    it("should return mutable url for minted nfts after _uriValidUptoTokenId", async function () {
      const { c, mutableUri, immutableUri } = await loadFixture(deployFixture);
      await c.setPermanentBaseUriUpTo(immutableUri, 10);
      await c.setMaxInitialSupply(5);
      const inputs = await c.getMintRangeInput(50);
      await c.mintPhotos(...inputs);

      for (let i = 1; i < 50; i++) {
        if (i > 10) expect(await c.uri(i)).to.include(mutableUri);
        else expect(await c.uri(i)).to.include(immutableUri);
      }
    });
  });

  describe("Max Initial Supply ", function () {

    it("should fail to get mintRangeInput without max initial supply", async function () {
      const { c } = await loadFixture(deployFixture);
      await expect(c.getMintRangeInput(4)).to.be.rejectedWith("No max initial supply set. Use _setMaxInitialSupply()");
    });

    it("should fail to set max initial supply when paused", async function () {
      const { c } = await loadFixture(deployFixture);
      await c.pause();
      await expect(c.setMaxInitialSupply(5)).to.be.rejectedWith("Pausable: paused");
    });

    it("Should invalidate mintRangeInput when maxInitialSupply is set", async function () {
      const { c } = await loadFixture(deployFixture);
      const initialSupply = 5;
      const initialSupply2 = 7;

      await c.setMaxInitialSupply(initialSupply);
      expect(await c["maxInitialSupply()"]()).to.equal(initialSupply);
      const inputs = await c.getMintRangeInput(5);
      await c.setMaxInitialSupply(initialSupply2);
      await expect(c.mintPhotos(...inputs)).to.be.revertedWith("Invalid input. Use getMintRangeInput()");
    });

    it("Should correctly update max initial supply via setMaxInitialSupply", async function () {
      const { c } = await loadFixture(deployFixture);
      const initialSupply = 5;
      const initialSupply2 = 7;

      await expect(c["maxInitialSupply()"]()).to.be.revertedWith("No max initial supply set. Use _setMaxInitialSupply()");

      await c.setMaxInitialSupply(initialSupply);
      expect(await c["maxInitialSupply()"]()).to.equal(initialSupply);
      const inputs = await c.getMintRangeInput(5);
      await c.mintPhotos(...inputs);
      for (let i = 0; i < inputs[0].length; i++) {
        expect(await c["maxInitialSupply(uint256)"](inputs[0][i])).to.equal(initialSupply);
      }

      await c.setMaxInitialSupply(20);
      expect(await c["maxInitialSupply()"]()).to.equal(20);

      await c.setMaxInitialSupply(initialSupply2);
      expect(await c["maxInitialSupply()"]()).to.equal(initialSupply2);
      const inputs2 = await c.getMintRangeInput(5);
      await c.mintPhotos(...inputs2);
      for (let i = 0; i < inputs2[0].length; i++) {
        expect(await c["maxInitialSupply(uint256)"](inputs2[0][i])).to.equal(initialSupply2);
      }

    });

    it("Should distribute tokens evenly within max supply range", async function () {
      const { c } = await loadFixture(deployFixture);

      const mints = 200;
      const testSuppliesTo = 9;
      const acceptedVariance = 0.7;

      for (let i = 1; i <= testSuppliesTo; i++) {
        const maxSupply = i
        await c.setMaxInitialSupply(maxSupply);
        const inputs = await c.getMintRangeInput(mints);
        const treasuryBalances = inputs[1][0];
        const balanceDistribution: { [key: number]: number } = {};

        for (let k = 0; k < mints; k++) {
          expect(treasuryBalances[k]).to.lte(maxSupply)

          balanceDistribution[treasuryBalances[k].toNumber()] = balanceDistribution[treasuryBalances[k].toNumber()] ?? 0;
          balanceDistribution[treasuryBalances[k].toNumber()]++;
        }
        expect(balanceDistribution[0]).to.equal(undefined);
        for (let k = 1; k < maxSupply; k++) {
          expect(balanceDistribution[i]).to.be.gte(acceptedVariance * mints / maxSupply);
        }
      }

    });
  })

  describe("Mint Photos", function () {
    it("should mint 1 vault and up to max supply to treasury ", async function () {
      const { c, vault, treasury } = await loadFixture(deployFixture);
      const photos = 100;
      const maxSupply = 2;
      await c.setMaxInitialSupply(maxSupply);
      const input = await c.getMintRangeInput(photos);

      const vaultAddresses = new Array(photos).fill(vault.address);
      const treasuryAddresses = new Array(photos).fill(treasury.address);
      const tx = await c.mintPhotos(...input);
      const receipt = await tx.wait();;
      const ids = input[0];
      const vaultBalances = await c.balanceOfBatch(vaultAddresses, ids);
      const treasuryBalances = await c.balanceOfBatch(treasuryAddresses, ids);

      const transferEvents = receipt.events?.filter(e => e.event === "TransferBatch") || [];

      expect(transferEvents?.length).to.equal(2);

      for (let i = 0; i < (transferEvents?.length ?? 0); i++) {
        const event = transferEvents?.[i]!;
        expect(input[1][i]).to.deep.equal(event.args?.[4]);
      }

      for (let i = 0; i < photos; i++) {
        expect(vaultBalances[i]).to.equal(1);
        expect(vaultBalances[i]).to.equal(input[1][1][i]);
        expect(treasuryBalances[i]).to.equal(input[1][0][i]);
        expect(treasuryBalances[i]).to.lte(maxSupply);
      }
    });
  })

  describe("Claim tokens", function () {
    it("should mint 10 claim tokens to treasury wallet ", async function () {
      const { c, treasury, vault } = await loadFixture(deployFixture);
      expect(await c.balanceOf(treasury.address, 0)).to.equal(10);
      expect(await c.balanceOf(vault.address, 0)).to.equal(0);
    });

    it("should mint claim tokens to any wallet ", async function () {
      const { c, treasury, account1 } = await loadFixture(deployFixture);

      await c.mintClaims(account1.address, 2);

      expect(await c.totalSupply(0)).to.equal(12);
      expect(await c.balanceOf(treasury.address, 0)).to.equal(10);
      expect(await c.balanceOf(account1.address, 0)).to.equal(2);

    });

    it("should claim mints from treasury and burn claims when redeemClaimBatch is called", async function () {

      const { c, treasury, vault, account1, account2 } = await loadFixture(deployFixture);

      await c.setMaxInitialSupply(1);
      const input1 = await c.getMintRangeInput(5);
      await c.mintPhotos(...input1);

      const newTreasury = account2.address
      await c.setInitialHolders(newTreasury, vault.address);

      const input2 = await c.getMintRangeInput(5);
      await c.mintPhotos(...input2);

      await c.connect(treasury).safeTransferFrom(treasury.address, account1.address, 0, 2, []);

      expect(await c.balanceOf(account1.address, 0)).to.equal(2);

      await expect(c.connect(account1).redeemClaimBatch([8, 9, 7], [1, 1, 1])).to.be.rejected;
      await expect(c.connect(account1).redeemClaimBatch([8], [1, 1])).to.be.rejected;
      await expect(c.connect(account1).redeemClaimBatch([8, 9], [1])).to.be.rejected;
      await expect(c.connect(account1).redeemClaimBatch([8, 2], [1, 1])).to.be.rejectedWith("Can't batch claim tokens from multiple treasury wallets.");
      await c.connect(account1).redeemClaimBatch([4, 2], [1, 1]);

      expect(await c.balanceOf(account1.address, 0)).to.equal(0);
      expect(await c.balanceOf(account1.address, 2)).to.equal(1);
      expect(await c.balanceOf(account1.address, 4)).to.equal(1);

      expect(await c.balanceOf(treasury.address, 2)).to.equal(0);
      expect(await c.balanceOf(treasury.address, 4)).to.equal(0);
    });

    it("should claim mint from treasury and burn claim when redeemClaim is called", async function () {

      const { c, treasury, vault, account1, account2 } = await loadFixture(deployFixture);
      await c.setMaxInitialSupply(1);

      const input1 = await c.getMintRangeInput(5);
      await c.mintPhotos(...input1);

      const newTreasury = account2.address
      await c.setInitialHolders(newTreasury, vault.address);

      const input2 = await c.getMintRangeInput(5);
      await c.mintPhotos(...input2);

      await c.connect(treasury).safeTransferFrom(treasury.address, account1.address, 0, 2, []);

      expect(await c.balanceOf(account1.address, 0)).to.equal(2);

      await c.connect(account1).redeemClaim(8);
      await c.connect(account1).redeemClaim(2);

      expect(await c.balanceOf(account1.address, 0)).to.equal(0);
      expect(await c.balanceOf(account1.address, 2)).to.equal(1);
      expect(await c.balanceOf(account1.address, 8)).to.equal(1);

      expect(await c.balanceOf(treasury.address, 2)).to.equal(0);
      expect(await c.balanceOf(newTreasury, 8)).to.equal(0);
    });

  });

  describe("Update initial holders / getPh101ppDailyPhotoUpdateInitialHoldersRangeInput", function () {
    it("should correcly update vault address only", async function () {
      const { c, vault, treasury, account1 } = await loadFixture(deployFixture);
      const photos = 10;
      const maxSupply = 5;

      await c.setMaxInitialSupply(maxSupply);

      const input = await c.getMintRangeInput(photos);

      const vaultAddresses = new Array(photos).fill(vault.address);
      const treasuryAddresses = new Array(photos).fill(treasury.address);

      await c.mintPhotos(...input);
      const ids = input[0];
      const vaultBalances = await c.balanceOfBatch(vaultAddresses, ids);
      const treasuryBalances = await c.balanceOfBatch(treasuryAddresses, ids);

      for (let i = 0; i < photos; i++) {
        expect(vaultBalances[i]).to.equal(1);
        expect(treasuryBalances[i]).to.gte(1);
      }

      await c.pause();
      const updateInitialHoldersInput = await getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(c, 0, Infinity, treasury.address, account1.address);

      const tx = await c.updateInitialHoldersRange(...updateInitialHoldersInput);
      const receipt = await tx.wait();

      const newVaultAddresses = new Array(photos).fill(account1.address);
      const newTreasuryBalances = await c.balanceOfBatch(treasuryAddresses, ids);
      const newVaultBalances = await c.balanceOfBatch(newVaultAddresses, ids);
      const newOldVaultBalances = await c.balanceOfBatch(vaultAddresses, ids);

      for (let i = 0; i < photos; i++) {
        expect(newVaultBalances[i]).to.equal(1);
        expect(newOldVaultBalances[i]).to.equal(0);
        expect(treasuryBalances[i]).to.equal(newTreasuryBalances[i]);
      }

      expect(receipt.events?.filter(e => e.event === "TransferBatch").length).to.equal(1);
      expect(receipt.events?.filter(e => e.args?.from && e.args?.to && e.args?.from === e.args?.to).length).to.equal(0);
    });

    it("should correcly update treasury address only", async function () {
      const { c, vault, treasury, account1 } = await loadFixture(deployFixture);
      const photos = 10;
      const maxSupply = 5;
      await c.setMaxInitialSupply(maxSupply);
      const input = await c.getMintRangeInput(photos);

      const vaultAddresses = new Array(photos).fill(vault.address);
      const treasuryAddresses = new Array(photos).fill(treasury.address);

      await c.mintPhotos(...input);
      const ids = input[0];
      const vaultBalances = await c.balanceOfBatch(vaultAddresses, ids);
      const treasuryBalances = await c.balanceOfBatch(treasuryAddresses, ids);

      for (let i = 0; i < photos; i++) {
        expect(vaultBalances[i]).to.equal(1);
        expect(treasuryBalances[i]).to.gte(1);
      }

      await c.pause();
      const updateInitialHoldersInput = await getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(c, 0, Infinity, account1.address, vault.address);
      const tx = await c.updateInitialHoldersRange(...updateInitialHoldersInput);
      const receipt = await tx.wait();

      const newTreasuryAddresses = new Array(photos).fill(account1.address);
      const newTreasuryBalances = await c.balanceOfBatch(newTreasuryAddresses, ids);
      const newOldTreasuryBalances = await c.balanceOfBatch(treasuryAddresses, ids);
      const newVaultBalances = await c.balanceOfBatch(vaultAddresses, ids);

      for (let i = 0; i < photos; i++) {
        expect(newVaultBalances[i]).to.equal(1);
        expect(newOldTreasuryBalances[i]).to.equal(0);
        expect(treasuryBalances[i]).to.equal(newTreasuryBalances[i]);
      }

      expect(receipt.events?.filter(e => e.event === "TransferBatch").length).to.equal(1);
      expect(receipt.events?.filter(e => e.args?.from && e.args?.to && e.args?.from === e.args?.to).length).to.equal(0);
    });

    it("should correcly swap treasury and vault addresses", async function () {
      const { c, vault, treasury } = await loadFixture(deployFixture);
      const photos = 10;
      const maxSupply = 5;
      await c.setMaxInitialSupply(maxSupply);
      const input = await c.getMintRangeInput(photos);

      const vaultAddresses = new Array(photos).fill(vault.address);
      const treasuryAddresses = new Array(photos).fill(treasury.address);

      await c.mintPhotos(...input);
      const ids = input[0];
      const vaultBalances = await c.balanceOfBatch(vaultAddresses, ids);
      const treasuryBalances = await c.balanceOfBatch(treasuryAddresses, ids);

      for (let i = 0; i < photos; i++) {
        expect(vaultBalances[i]).to.equal(1);
        expect(treasuryBalances[i]).to.gte(1);
      }

      await c.pause();
      const updateInitialHoldersInput = await getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(c, 0, Infinity, vault.address, treasury.address);

      await c.updateInitialHoldersRange(...updateInitialHoldersInput);

      const newTreasuryBalances = await c.balanceOfBatch(vaultAddresses, ids);
      const newVaultBalances = await c.balanceOfBatch(treasuryAddresses, ids);

      for (let i = 0; i < photos; i++) {
        expect(newVaultBalances[i]).to.equal(vaultBalances[i]);
        expect(newTreasuryBalances[i]).to.equal(treasuryBalances[i]);
      }
    });

    it("should fail to updated initialHolders if isInitialHoldersRangeUpdatePermanentlyDisabled", async function () {
      const { c, vault, treasury } = await loadFixture(deployFixture);
      const photos = 10;
      const maxSupply = 5;

      await c.setMaxInitialSupply(maxSupply);
      const input = await c.getMintRangeInput(photos);
      await c.mintPhotos(...input);
      await c.permanentlyDisableInitialHoldersRangeUpdate();
      await c.pause();

      const updateInitialHoldersInput = await getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(c, 0, Infinity, vault.address, treasury.address);
      await expect(c.updateInitialHoldersRange(...updateInitialHoldersInput)).to.be.rejected;
      expect(await c.isInitialHoldersRangeUpdatePermanentlyDisabled()).to.be.true;
    })
  });

  describe("ERC2981 Token Royalties", function () {

    it("should set default royalties during deploy", async function () {
      const { c, owner } = await loadFixture(deployFixture);
      expect(await c.royaltyInfo(0, 100)).to.deep.equal([owner.address, 5]);
      expect(await c.royaltyInfo(1, 100)).to.deep.equal([owner.address, 5]);
      expect(await c.royaltyInfo(100, 100)).to.deep.equal([owner.address, 5]);
      expect(await c.royaltyInfo(1000, 100)).to.deep.equal([owner.address, 5]);
    });

    it("should be able to set new default royalties", async function () {
      const { c, owner, account1 } = await loadFixture(deployFixture);
      await c.setDefaultRoyalty(account1.address, 100);
      expect(await c.royaltyInfo(0, 100)).to.deep.equal([account1.address, 1]);
      expect(await c.royaltyInfo(1, 100)).to.deep.equal([account1.address, 1]);
      expect(await c.royaltyInfo(100, 100)).to.deep.equal([account1.address, 1]);
      expect(await c.royaltyInfo(1000, 100)).to.deep.equal([account1.address, 1]);

      await c.setDefaultRoyalty(owner.address, 0);
      expect(await c.royaltyInfo(0, 100)).to.deep.equal([owner.address, 0]);
      expect(await c.royaltyInfo(1, 100)).to.deep.equal([owner.address, 0]);
      expect(await c.royaltyInfo(100, 100)).to.deep.equal([owner.address, 0]);
      expect(await c.royaltyInfo(1000, 100)).to.deep.equal([owner.address, 0]);
    });

    it("should be able to set and reset royalties for single token", async function () {
      const { c, owner, account1 } = await loadFixture(deployFixture);
      await c.setTokenRoyalty(1, account1.address, 10000);
      await c.setTokenRoyalty(2, account1.address, 50);
      await c.setTokenRoyalty(3, account1.address, 100);
      expect(await c.royaltyInfo(0, 100)).to.deep.equal([owner.address, 5]);
      expect(await c.royaltyInfo(1, 100)).to.deep.equal([account1.address, 100]);
      expect(await c.royaltyInfo(2, 100)).to.deep.equal([account1.address, 0]);
      expect(await c.royaltyInfo(3, 100)).to.deep.equal([account1.address, 1]);
      expect(await c.royaltyInfo(4, 100)).to.deep.equal([owner.address, 5]);
      expect(await c.royaltyInfo(1000, 100)).to.deep.equal([owner.address, 5]);

      await c.resetTokenRoyalty(2);
      await c.resetTokenRoyalty(3);

      expect(await c.royaltyInfo(0, 100)).to.deep.equal([owner.address, 5]);
      expect(await c.royaltyInfo(1, 100)).to.deep.equal([account1.address, 100]);
      expect(await c.royaltyInfo(2, 100)).to.deep.equal([owner.address, 5]);
      expect(await c.royaltyInfo(3, 100)).to.deep.equal([owner.address, 5]);
      expect(await c.royaltyInfo(4, 100)).to.deep.equal([owner.address, 5]);
      expect(await c.royaltyInfo(1000, 100)).to.deep.equal([owner.address, 5]);

    });

  });

  describe("AccessControl", function () {

    it("should set default roles during deploy", async function () {
      const { c, owner } = await loadFixture(deployFixture);
      expect(await c.hasRole(await c.CLAIM_MINTER_ROLE(), owner.address)).to.be.true;
      expect(await c.hasRole(await c.PHOTO_MINTER_ROLE(), owner.address)).to.be.true;
      expect(await c.hasRole(await c.URI_UPDATER_ROLE(), owner.address)).to.be.true;
      expect(await c.hasRole(await c.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("should fail to execute access guarded functions without role", async function () {
      const { c, account1 } = await loadFixture(deployFixture);
      await c.pause();
      const updateInitialHoldersInput = await getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(c, 0, 100, account1.address, account1.address);
      await expect(c.connect(account1).updateInitialHoldersRange(...updateInitialHoldersInput)).to.be.rejectedWith("AccessControl");
      await c.unpause();
      await c.setMaxInitialSupply(4);
      const mintInput = await c.getMintRangeInput(4);
      await expect(c.connect(account1).mintPhotos(...mintInput)).to.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).mintClaims(account1.address, 5)).to.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).setInitialHolders(account1.address, account1.address)).to.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).pause()).to.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).unpause()).to.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).setPermanentBaseUriUpTo("", 100)).to.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).setProxyBaseUri("")).to.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).setDefaultRoyalty(account1.address, 100)).to.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).setTokenRoyalty(1, account1.address, 100)).to.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).resetTokenRoyalty(1)).to.be.rejectedWith("AccessControl");
    });

    it("should execute access guarded functions with special role", async function () {
      const { c, account1, account2, account3, account4 } = await loadFixture(deployFixture);

      await c.grantRole(await c.DEFAULT_ADMIN_ROLE(), account1.address);
      await c.pause();
      const updateInitialHoldersInput = await getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(c, 0, 100, account1.address, account1.address);
      await expect(c.connect(account1).updateInitialHoldersRange(...updateInitialHoldersInput)).to.not.be.rejectedWith("AccessControl");
      await c.unpause();
      await expect(c.connect(account1).setInitialHolders(account1.address, account1.address)).to.not.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).pause()).to.not.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).unpause()).to.not.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).setDefaultRoyalty(account1.address, 100)).to.not.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).setTokenRoyalty(1, account1.address, 100)).to.not.be.rejectedWith("AccessControl");
      await expect(c.connect(account1).resetTokenRoyalty(1)).to.not.be.rejectedWith("AccessControl");

      await c.grantRole(await c.PHOTO_MINTER_ROLE(), account2.address);
      await c.setMaxInitialSupply(4);
      const mintInput = await c.getMintRangeInput(4);
      await expect(c.connect(account2).mintPhotos(...mintInput)).to.not.be.rejectedWith("AccessControl");

      await c.grantRole(await c.CLAIM_MINTER_ROLE(), account3.address);
      await expect(c.connect(account3).mintClaims(account1.address, 5)).to.not.be.rejectedWith("AccessControl");

      await c.grantRole(await c.URI_UPDATER_ROLE(), account4.address);
      await expect(c.connect(account4).setPermanentBaseUriUpTo("", 100)).to.not.be.rejectedWith("AccessControl");
      await expect(c.connect(account4).setProxyBaseUri("")).to.not.be.rejectedWith("AccessControl");
    });

  });
}


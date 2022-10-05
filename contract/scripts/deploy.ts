import { ethers } from "hardhat";

async function main() {
  const mutableUri = "https://ph101pp-daily-photo.vercel.app/api/proxy/";
  const immutableUri = "https://arweave.net/1a-HDKflsjG2_b3jAuMYTrQyB13BNarkz0WZdCEBj0E/";
  const treasury = "0x7E00FE5a6AAc417167A1a506550255CAfB5196a6";
  const vault = "0x1347aeA833D7a54456EAa76f45b66a9d91d0afb2";

  const PDP = await ethers.getContractFactory("Ph101ppDailyPhotos");
  const pdp = await PDP.deploy(mutableUri, immutableUri, treasury, vault);
  await pdp.deployed();
  console.log(`deployed: Ph101ppDailyPhotos`, pdp.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

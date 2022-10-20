import { ethers } from "hardhat";

async function main() {
  const mutableUri = "https://daily-photo.ph101pp.xyz/api/proxy/";
  const immutableUri = "https://arweave.net/qpe8Ck5wSjxl21DhNP4tMdu571ePYeX180Cwz9u8gTw/";
  const treasury = "0x7E00FE5a6AAc417167A1a506550255CAfB5196a6"; // Decentraland
  const vault = "0x1347aeA833D7a54456EAa76f45b66a9d91d0afb2"; //Jarvis

  const PDP = await ethers.getContractFactory("Ph101ppDailyPhoto");
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

import { ethers } from "hardhat";
const deployArguments = require("./deployArguments") as [string, string, string, string];
async function main() {

  const PDP = await ethers.getContractFactory("Ph101ppDailyPhoto");
  const pdp = await PDP.deploy(...deployArguments);
  await pdp.deployed();
  console.log(`deployed: Ph101ppDailyPhotos`, pdp.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

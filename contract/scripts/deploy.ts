import { ethers } from "hardhat";
const deployArguments = require("./deployArguments") as [string, string, string, string];

async function main() {

  const DT = await ethers.getContractFactory("DateTime");
  const dt = await DT.deploy();
  const PDP = await ethers.getContractFactory("Ph101ppDailyPhoto", {
    libraries: {
      "DateTime": dt.address
    }
  });
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

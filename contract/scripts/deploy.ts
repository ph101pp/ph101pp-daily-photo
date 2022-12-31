import { ethers } from "hardhat";
const deployArguments = require("./deployArguments") as [string, [string, string]];

async function main() {

  // deploy utils
  const Utils = await ethers.getContractFactory("Ph101ppDailyPhotoUtils");
  const utils = await Utils.deploy();

  // deploy Pdp
  const PDP = await ethers.getContractFactory("Ph101ppDailyPhoto", {
    libraries: {
      "Ph101ppDailyPhotoUtils": utils.address
    }
  });
  const pdp = await PDP.deploy(...deployArguments);
  await pdp.deployed();

  // register with operator fiter registry
  const OperatorFilterRegistry = await ethers.getContractFactory("TestOperatorFilterRegistry");
  const ofr = await OperatorFilterRegistry.attach("0x000000000000AAeB6D7670E522A718067333cd4E");
  await ofr.registerAndSubscribe(pdp.address, "0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6");

  console.log(`deployed: Ph101ppDailyPhoto`, pdp.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

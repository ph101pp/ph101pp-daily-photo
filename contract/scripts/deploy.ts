import { ethers } from "hardhat";

async function main() {
  const mutableUri = "https://ph101pp-daily-photo.vercel.app/api/proxy/";
  const immutableUri = "https://arweave.net/1a-HDKflsjG2_b3jAuMYTrQyB13BNarkz0WZdCEBj0E/";
  const treasury = "0x7E00FE5a6AAc417167A1a506550255CAfB5196a6";
  const vault = "0x1347aeA833D7a54456EAa76f45b66a9d91d0afb2";

  // const PDPTokenId = await ethers.getContractFactory("Ph101ppDailyPhotoTokenId");
  // const pdpTokenId = await PDPTokenId.deploy();
  // await pdpTokenId.deployed();

  // console.log(`deployed: Ph101ppDailyPhotoTokenId`, pdpTokenId.address);

  const PDP = await ethers.getContractFactory("Ph101ppDailyPhotos", {
    libraries: {
      Ph101ppDailyPhotoTokenId: "0x9AFb855a02A44766dD6859448ecce97493322F01" // pdpTokenId.address,
    },
  });
  const pdp = await PDP.deploy(mutableUri, treasury, vault);
  await pdp.deployed();
  console.log(`deployed: Ph101ppDailyPhotos`, pdp.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

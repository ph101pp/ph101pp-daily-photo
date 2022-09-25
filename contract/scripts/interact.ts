import { ethers } from "hardhat";

const tokenIdAddress = "0x9AFb855a02A44766dD6859448ecce97493322F01";
const photosAddress = "0xA4Cc886811b8110307171C3a60C0406DC5f7392a";

// async function main() {
//   const pdp = await ethers.getContractAt("Ph101ppDailyPhotos", photosAddress);
  
//   const input = await pdp.getMintRangeInput(1000);

//   const tx = await pdp.mintPhotos(...input, 10);

//   const receipt = await tx.wait();

//   console.log(receipt)
// }

async function main() {
  const pdp = await ethers.getContractAt("Ph101ppDailyPhotos", photosAddress);
  
  const tx = await pdp.setDefaultRoyalty("0x2852578456552053183201a7c99EF7FA813b3622", 500);

  const receipt = await tx.wait();

  console.log(receipt)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
import { ethers } from "hardhat";

const tokenIdAddress = "0x9AFb855a02A44766dD6859448ecce97493322F01";
const photosAddress1 = "0xA4Cc886811b8110307171C3a60C0406DC5f7392a";
const photosAddress2 = "0x41A8608Fd85a7a83ad314Ed008c635b5C5981011";
const photosAddress3 = "0x58Fb81151931DDD7A49A7ACA9C116d865FB53DeD";
const photosAddress4 = "0x9Fb8B5a8b30e42D739202b0A766cC5AbAD7977e8";

async function main() {
  const pdp = await ethers.getContractAt("Ph101ppDailyPhoto", photosAddress4);
  
  
  // const tx = await pdp.setPermanentURI("https://arweave.net/1a-HDKflsjG2_b3jAuMYTrQyB13BNarkz0WZdCEBj0E/", 1);
  // const tx = await pdp.setMutableURI("https://ph101pp-daily-photo.vercel.app/api/proxy/");
  
  const input = await pdp.getMintRangeInput(122);
  const tx = await pdp.mintPhotos(...input, 3);

  const receipt = await tx.wait();

  console.log(receipt)
}

// async function main() {
//   const pdp = await ethers.getContractAt("Ph101ppDailyPhotos", photosAddress);
  
//   const tx = await pdp.setDefaultRoyalty("0x2852578456552053183201a7c99EF7FA813b3622", 500);

//   const receipt = await tx.wait();

//   console.log(receipt)
// }

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
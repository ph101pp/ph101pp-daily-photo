import { ethers } from "hardhat";

const tokenIdAddress = "0x9AFb855a02A44766dD6859448ecce97493322F01";
const photosAddress1 = "0xA4Cc886811b8110307171C3a60C0406DC5f7392a";
const photosAddress2 = "0x41A8608Fd85a7a83ad314Ed008c635b5C5981011";
const photosAddress3 = "0x58Fb81151931DDD7A49A7ACA9C116d865FB53DeD";
const photosAddress4 = "0x9Fb8B5a8b30e42D739202b0A766cC5AbAD7977e8";
const photosAddress5 = "0xd92d5acC92751588EE82265226640f0B79B49ecE";
const photosAddress6 = "0x7860a667A3a84B8643981DF1dFa98Fa458D3CC73";
const photosAddress7 = "0x443D022e06ed1Ed8e8e29FaF65bB8D4c01842814";
const photosAddress8 = "0x44A549A3FaB9de863F495eb141c8a0Ef8F5782D5";
const photosAddress9 = "0x0d500E1c85abeA744D99B50708E12ADA2202726b";
const photosAddress10 = "0x5433c0e7616848Ac8ba043dF4a8B4C62cF747171";
const photosAddress11 = "0x9f2dD4Be989E5C806a3eEC34f8c26929fb6Cc4B0";
const photosAddress12 = "0x4Ad20a44489a92dd36d89B4596c17C43efE88b57";
const photosAddress13 = "0x2f084edfc16573117b8cbFC01e1206CfAe5589Ac";
const photosAddress14 = "0x74F5ab6D014AEa53448B4CB8A735ae9B29b5AAe3";

const mainnetAddress1 = "0x986A4010D6dF5754f66F72764487070615CBDE9A";
async function main() {
  const pdp = await ethers.getContractAt("Ph101ppDailyPhoto", photosAddress14);
  
  
  // do this first:
  // await pdp.setPermanentBaseUriUpTo("https://arweave.net/sc9G7tPVgyr9ajAl5erCclHUPq4N_i9hV_s8rjQ8n0o/", 0);
  // const tx = await pdp.mintClaims("0x1347aeA833D7a54456EAa76f45b66a9d91d0afb2", 10, []);


  // do this second:
  // const input = await pdp.getMintRangeInput(122);
  // const tx = await pdp.mintPhotos(...input);
  
  const receipt = await tx.wait();
  console.log(receipt);


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
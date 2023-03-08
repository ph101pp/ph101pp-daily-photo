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
  const pdp = await ethers.getContractAt("Ph101ppDailyPhoto", mainnetAddress1);
  let tx, receipt;

  // do this first:
  // tx = await pdp.setPermanentBaseUriUpTo("ar://bbgqsCNHX5lbWnZBU6k5XpBtE5-hYhtiZa-33DZa9ts/", 0);
  // receipt = await tx.wait();
  // console.log(receipt);

  // tx = await pdp.mintClaims("0x668EC8c20fc5de4aE0a5347801cbC19c6c234563", 10, []);
  // receipt = await tx.wait();
  // console.log(receipt);

  // tx = await pdp.setInitialSupply([1,2]);
  // receipt = await tx.wait();
  // console.log(receipt);

  // do this second:
  // const input = await pdp.getMintRangeInput(122+31+28+31); // till March 31, 2023
  // console.log(JSON.stringify(input[0]))
  // console.log(JSON.stringify(input[1]))
  // tx = await pdp.mintPhotos(...input);
  // receipt = await tx.wait();
  // console.log(receipt);

  // do this third:
  // tx = await pdp.setProxyBaseUri("https://daily.ph101pp.xyz/api/proxy/");
  // receipt = await tx.wait();
  // console.log(receipt);

  // do this fourth:
  // tx = await pdp.setDefaultRoyalty("0xe9bcD41B919A144b196905CAee3D7E18F0Bcf3Ba", 690);
  // receipt = await tx.wait();
  // console.log(receipt);

  // do this fifth:
  // tx = await pdp.setInitialHolders(
  //   "0x43B9A200Fc2BAFe82f8992254c2b3df98beCfC73", // treasury -> generate new private key
  //   "0xe9bcD41B919A144b196905CAee3D7E18F0Bcf3Ba" // vault
  // );
  // receipt = await tx.wait();
  // console.log(receipt);

  ////// // do this fourth:
  ////// tx = await pdp.transferOwnership("0xceeaea7510728C1233BEB305a0370CBB2503798A");
  ////// // goerli // tx = await pdp.transferOwnership("0x50580ca4C2000c031B21747c47036CFFD3Cee226");
  ////// receipt = await tx.wait();
  ////// console.log(receipt);

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
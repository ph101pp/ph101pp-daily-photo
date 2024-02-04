import Arweave from "arweave";
import { webcrypto } from "crypto"
import { base64 } from "ethers/lib/utils";
import fs from "fs";

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

execute();
async function execute() {

  const verify = process.cwd() + "/../VERIFY_METADATA_LOCAL.csv";
  const metadataDirname = process.cwd() + "/../TOKEN_METADATA";
  const imageDirname = process.cwd() + "/../TOKEN_IMAGES";
  const tokens = fs.readdirSync(metadataDirname);

  fs.writeFileSync(verify, "token,imageSizeMatch,imageHashMatch\n")
  console.log(tokens.length);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === ".DS_Store") {
      continue
    }

    const metadata = fs.readFileSync(metadataDirname + "/" + token).toString("utf-8");
    const data = JSON.parse(metadata.replace(/\n/g, ""));

    const image = fs.readFileSync(imageDirname + "/" + token.replace("json", "jpg"));
    const hash = await sha256("data:image/jpeg;base64," + image.toString("base64"));

    const result = `${token},${data.image_details.size === image.byteLength},${hash === data.image_details.sha256}\n`;
    console.log(result);
    console.log(data.image_details.size, image.byteLength, hash, data.image_details.sha256)
    fs.appendFileSync(verify, result);
  }
}

async function sha256(text: string): Promise<string> {
  const textAsBuffer = new TextEncoder().encode(text);
  // @ts-ignore
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', textAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
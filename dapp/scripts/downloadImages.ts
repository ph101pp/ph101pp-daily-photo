import Arweave from "arweave";
import { webcrypto } from "crypto"
import fs from "fs";

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

execute();
async function execute() {


  const imagesDirname = process.cwd() + "/../TOKEN_IMAGES";
  const metadataDirname = process.cwd() + "/../TOKEN_METADATA";
  const tokens = fs.readdirSync(metadataDirname);

  if (!fs.existsSync(imagesDirname)) {
    fs.mkdirSync(imagesDirname);
  }

  console.log(tokens.length);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === ".DS_Store") {
      continue;
    }
    const imagePath = imagesDirname + "/" + token.replace("json", "jpg");
    if (fs.existsSync(imagePath)) {
      continue;
    }
    console.log(i, tokens.length)
    const metadata = fs.readFileSync(metadataDirname + "/" + token).toString("utf-8");
    const data = JSON.parse(metadata.replace(/\n/g, ""));

    const image = await arweave.transactions.getData(data.image.replace("ar://", ""), { decode: true }) as Uint8Array

    fs.appendFileSync(
      imagePath,
      Buffer.from(image)
    );
  }
}
import 'dotenv/config'
import Bundlr from "@bundlr-network/client"
import { Connection, Keypair } from "@solana/web3.js";

import Arweave from "arweave";
import { webcrypto } from "crypto"
import { base64 } from "ethers/lib/utils";
import fs from "fs";


const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY!)));
const serverBundlr = new Bundlr(process.env.NEXT_PUBLIC_BUNDLR_NETWORK_NODE!, "solana", keypair.secretKey);

execute();
async function execute() {
  const metadataDirname = process.cwd() + "/../TOKEN_METADATA";
  const manifestFilename = process.cwd() + "/../LATEST_MANIFEST.json";
  const manifestUrlFilename = process.cwd() + "/../LATEST_MANIFEST_URI.txt";

  const response = await serverBundlr.uploadFolder(metadataDirname, {
    batchSize: 100,
  })

  const id = response?.id

  if (!id) {
    throw "Failed to upload"
  }

  const manifest = fs.readFileSync(metadataDirname + "-manifest.json").toString("utf-8");

  fs.rmSync(metadataDirname + "-manifest.json");
  fs.rmSync(metadataDirname + "-manifest.csv");
  fs.rmSync(metadataDirname + "-id.txt");

  const newManifest = manifest.replaceAll(".json", "");

  const manifestResponse = await serverBundlr.upload(newManifest, {
    tags: [
      { name: "Content-type", value: "application/x.arweave-manifest+json" },
      { name: "author", value: "Philipp Adrian (ph101pp.eth)" },
      { name: "project", value: "Ph101pp Daily" },
      { name: "website", value: "https://daily.ph101pp.xyz" },
    ]
  })

  fs.writeFileSync(manifestUrlFilename, "ar://" + manifestResponse.id+"/");
  fs.writeFileSync(manifestFilename, JSON.stringify(JSON.parse(newManifest), null, "  "));
}


import 'dotenv/config'
import Bundlr from "@bundlr-network/client"
import { Connection, Keypair } from "@solana/web3.js";

import Arweave from "arweave";
import { webcrypto } from "crypto"
import { base64 } from "ethers/lib/utils";
import fs from "fs";


execute();
async function execute() {

  const manifestFilename = process.cwd() + "/../LATEST_MANIFEST.json";

  const manifest = fs.readFileSync(manifestFilename).toString("utf-8");

  const json = JSON.parse(manifest);

  const keys = Object.keys(json.paths).sort()

  const sortedKeys = [keys.pop(), ...keys] as string[];

  const pathEntries = sortedKeys.map((key) => [key, json.paths[key]]);

  const newPaths = Object.fromEntries(pathEntries)

  json.paths = newPaths;

  fs.writeFileSync(manifestFilename, JSON.stringify(json, null, "  "));
}


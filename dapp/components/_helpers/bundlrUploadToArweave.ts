import WebBundlr from "@bundlr-network/client/build/web"
import { UploadResponse } from "@bundlr-network/client/build/common/types"
import { PublicKey } from "@solana/web3.js";

import base64ToArrayBuffer from "./base64ToArrayBuffer";
import arrayBufferToBase64 from "./arrayBufferToBase64";
import { BundlrStats } from "../_types/BundlrStats";

if (!process.env.NEXT_PUBLIC_BUNDLR_NETWORK_NODE || !process.env.NEXT_PUBLIC_SOLANA_PUBLIC_KEY) {
  throw new Error("Missing env variables.");
}

const bundlrNode = process.env.NEXT_PUBLIC_BUNDLR_NETWORK_NODE;
const publicKey = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_PUBLIC_KEY);
const provider = {
  publicKey,
  signMessage: () => {
    return "serverSignature";
  }
};
const bundlr = new WebBundlr(bundlrNode, "solana", provider);

type BundlrUploadToArweave = (data: Uint8Array | string, contentType: string) => Promise<[UploadResponse, BundlrStats]>

const bundlrUploadToArweave: BundlrUploadToArweave = async (data, contentType) => {

  await bundlr.ready();

  const transaction = bundlr.createTransaction(data, {
    tags: [
      { name: "Content-Type", value: contentType },
      // { name: "author", value: "Ph101pp" },
      // { name: "project", value: "Daily Photo" },
      // { name: "website", value: "https://daily-photo.ph101pp.xyz" },
    ]
  });

  transaction.rawOwner = publicKey.toBuffer();

  // get signature data
  const signatureData = await transaction.getSignatureData();

  // get signed signature
  const signed = await fetch("/api/signBundlrTransaction", {
    method: "POST",
    body: JSON.stringify({
      signatureData: arrayBufferToBase64(signatureData),
      size: transaction.size
    })
  });
  const json = await signed.json();

  if (!json) {
    throw signed
  }

  const { signature: b64Signature, ...stats } = json;

  const signature = new Uint8Array(base64ToArrayBuffer(b64Signature));

  // write signed signature to transaction
  await transaction.setSignature(Buffer.from(signature));

  // check the tx is signed and valid
  // console.log({ isSigned: transaction.isSigned(), isValid: await transaction.isValid() });

  // upload as normal
  const result = await transaction.upload();

  return [result, stats];
}

export default bundlrUploadToArweave;

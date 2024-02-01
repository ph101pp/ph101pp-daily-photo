import { ethers } from "ethers6";

import type { NextApiRequest, NextApiResponse } from "next";
import { Chain, OpenSeaSDK } from "opensea-js";

const PRIVATE_KEY = process.env.ETHEREUM_TREASURY_PRIVATE_KEY!;
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY!;
const NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' })
  }
  const params = JSON.parse(req.body);
  const tokenId = params.tokenId;

  if (typeof tokenId !== "string") {
    return res.status(404).json({ message: 'Not Found' })

  }

  const alchemyProvider = new ethers.AlchemyProvider("mainnet", process.env.MAINNET_ALCHEMY_API_KEY);

  const walletWithProvider = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);

  const openseaSDK = new OpenSeaSDK(walletWithProvider, {
    chain: Chain.Mainnet,
    apiKey: OPENSEA_API_KEY,
  });
  try {
    const listing = await openseaSDK.createListing({
      asset: {
        tokenId,
        tokenAddress: NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS,
      },
      accountAddress: walletWithProvider.address,
      startAmount: 0.01,
      expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * 24 * 182),
    });
    return res.json(JSON.parse(JSON.stringify(listing, (key, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value // return everything else unchanged
    )));
  }
  catch (e) {
    console.log(e)
    return res.end("not ok")
  }
}

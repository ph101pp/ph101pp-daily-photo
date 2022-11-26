// This is an example of to protect an API route
import type { NextApiRequest, NextApiResponse } from "next"
import { isValidDate } from "../../../utils/isValidDate";
import { ethers } from "ethers";
import contract from "../../../../contract/artifacts/contracts/Ph101ppDailyPhoto.sol/Ph101ppDailyPhoto.json";

const wallet = ethers.Wallet.createRandom();
const alchemyProvider = new ethers.providers.AlchemyProvider("goerli", process.env.GOERLI_ALCHEMY_API_KEY!);
const signer = new ethers.Wallet(wallet.privateKey, alchemyProvider);
const Ph101ppDailyPhoto = new ethers.Contract(process.env.GOERLI_CONTRACT_ADDRESS!, contract.abi, signer);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const tokenId = req.query.tokenId;

  if (typeof tokenId !== "string" || tokenId.length !== 8) {
    return res.status(404).end();
  }

  if (!isValidDate(tokenId)) {
    return res.status(404).end();
  }

  const year = parseInt(tokenId.slice(0, 4));
  const month = parseInt(tokenId.slice(4, 6));
  const day = parseInt(tokenId.slice(6, 8));

  const tokenIndex = await Ph101ppDailyPhoto.tokenIdFromDate(year, month, day);

  res.json(tokenIndex.toNumber());
}

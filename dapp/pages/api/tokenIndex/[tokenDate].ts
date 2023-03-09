// This is an example of to protect an API route
import type { NextApiRequest, NextApiResponse } from "next"
import { isValidDate } from "../../../utils/isValidDate";
import { ethers } from "ethers";
import contract from "../../../utils/Ph101ppDailyPhoto.json";

const wallet = ethers.Wallet.createRandom();
const alchemyProvider = new ethers.providers.AnkrProvider("goerli");
const signer = new ethers.Wallet(wallet.privateKey, alchemyProvider);
const Ph101ppDailyPhoto = new ethers.Contract(process.env.NEXT_PUBLIC_GOERLI_CONTRACT_ADDRESS!, contract.abi, signer);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const tokenDate = req.query.tokenDate;

  if (typeof tokenDate !== "string" || tokenDate.length !== 8) {
    return res.status(404).end();
  }

  if (!isValidDate(tokenDate)) {
    return res.status(404).end();
  }

  const year = parseInt(tokenDate.slice(0, 4));
  const month = parseInt(tokenDate.slice(4, 6));
  const day = parseInt(tokenDate.slice(6, 8));

  const tokenSlug = await Ph101ppDailyPhoto.tokenSlugFromDate(year, month, day);

  res.setHeader("Cache-Control",`s-maxage=${60*60*24*31}`); // max cache
  res.json(tokenSlug);
}

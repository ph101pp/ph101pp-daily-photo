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
  const tokenIndex = req.query.tokenIndex;

  if (typeof tokenIndex !== "string") {
    return res.status(404).end();
  }

  const index = parseInt(tokenIndex);
  if (isNaN(index) || index >= 20220901) {
  return res.status(404).end();
}

  const [yearBN, monthBN, dayBN] = await Ph101ppDailyPhoto.tokenIdToDate(tokenIndex);

  const year = yearBN.toNumber();
  const month = monthBN.toNumber();
  const day = dayBN.toNumber();

  res.setHeader("Cache-Control",`s-maxage=${60*60*24*31}`); // max cache
  res.json(`${year}${month <= 9 ? "0" : ""}${month}${day <= 9 ? "0" : ""}${day}`);
}

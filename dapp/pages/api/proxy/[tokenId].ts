// This is an example of to protect an API route
import type { NextApiRequest, NextApiResponse } from "next"
import getFutureJSON from "../../../utils/getFutureJSON";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query.tokenId as string;

  if (typeof query !== "string" || query.length !== 13) {
    return res.status(404).end();
  }

  const [date, ext] = query.split(".");

  if (ext !== "json" || date.length !== 8) {
    return res.status(404).end();
  }

  const arweaveURL = process.env.LATEST_MANIFEST_URI;

  return fetch(arweaveURL + query)
    .then((arweaveResult) => arweaveResult.json())
    .then(res.json)
    .catch(() => res.json(getFutureJSON(date)));
}

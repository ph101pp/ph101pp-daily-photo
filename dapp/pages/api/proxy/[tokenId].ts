// This is an example of to protect an API route
import type { NextApiRequest, NextApiResponse } from "next"
import getClaimMetadata from "../../../utils/getClaimMetadata";
import getFutureMetadata from "../../../utils/getFutureMetadata";
import { isValidDate } from "../../../utils/isValidDate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query.tokenId;

  if (query === "CLAIM.json") {
    res.setHeader("Cache-Control", `s-maxage=${60 * 60 * 24}, stale-while-revalidate=59`);
    return res.json(getClaimMetadata())
  }

  if (typeof query !== "string" || query.length !== 13) {
    return res.status(404).end();
  }

  const [date, ext] = query.split(".");

  if (ext !== "json" || !isValidDate(date)) {
    return res.status(404).end();
  }

  const arweaveURL = process.env.LATEST_MANIFEST_URI;

  res.setHeader("Cache-Control", `s-maxage=${60 * 60 * 48}, stale-while-revalidate=59`);

  return fetch(arweaveURL + query)
    .then((arweaveResult) => {
      return arweaveResult.json()
    })
    .then(res.json)
    .catch(() => res.json(getFutureMetadata(date)));
}

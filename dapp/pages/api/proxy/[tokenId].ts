// This is an example of to protect an API route
import type { NextApiRequest, NextApiResponse } from "next"
import arweaveUrl from "../../../components/_helpers/arweaveUrl";
import getClaimMetadata from "../../../utils/getClaimMetadata";
import getFutureMetadata from "../../../utils/getFutureMetadata";
import { isValidDate } from "../../../utils/isValidDate";

const arweaveURL = arweaveUrl(process.env.LATEST_MANIFEST_URI!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const query = req.query.tokenId;

  if (query === "CLAIM-0") {
    res.setHeader("Cache-Control", `s-maxage=${60 * 60 * 48}, stale-while-revalidate=59`);
    return fetch(arweaveURL + "CLAIM-0")
      .then((arweaveResult) => {
        return arweaveResult.json()
      })
  }

  if (typeof query !== "string") {
    return res.status(404).end();
  }

  const [tokenSlug, _json] = query.split(".");
  const [tokenDate, tokenIndex] = tokenSlug.split("-");


  if (!isValidDate(tokenDate) || isNaN(parseInt(tokenIndex))) {
    return res.status(404).end();
  }

  res.setHeader("Cache-Control", `s-maxage=${60 * 60 * 48}, stale-while-revalidate=59`);

  return fetch(arweaveURL + tokenSlug)
    .then((arweaveResult) => {
      return arweaveResult.json()
    })
    .then(res.json)
    .catch(() => res.json(getFutureMetadata(tokenDate, tokenIndex)));
}

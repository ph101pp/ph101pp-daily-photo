// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "octokit"

import type { NextApiRequest, NextApiResponse } from "next"
import getFutureJSON from "../../../utils/getFutureJSON";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(process.env.LATEST_MANIFEST_URI);
  const query = req.query.tokenId as string;

  if (typeof query !== "string" || query.length !== 13) {
    return res.status(404).end();
  }

  const [date, ext] = query.split(".");

  if (ext !== "json" || date.length !== 8) {
    return res.status(404).end();
  }
  const octokit = new Octokit({
    auth: process.env.GITHUB_PROXY_TOKEN
  });
  const gist = await octokit.request(`GET /gists/${process.env.GIST_ID}`, {
    gist_id: process.env.GIST_ID
  });

  const arweaveURL = gist.data.files['latestManifestUri.txt'].content;
  fetch(arweaveURL + query)
    .then((arweaveResult) => arweaveResult.json())
    .then((json) => {
      res.json(json);
    })
    .catch(() => {
      res.json(getFutureJSON(date));
    });
}

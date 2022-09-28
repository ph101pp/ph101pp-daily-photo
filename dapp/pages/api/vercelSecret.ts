// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "octokit"

import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({req});
  console.log(process.env.LATEST_MANIFEST_URI)
  const octokit = new Octokit({
    auth: token?.access_token
  });
  const gist = await octokit.request(`GET /gists/${process.env.GIST_ID}`, {
    gist_id: process.env.GIST_ID
  });

  const arweaveURL = gist.data.files['latestManifestUri.txt'].content;

  const name = "LATEST_MANIFEST_URI"

  await fetch(`https://api.vercel.com/v2/secrets/${name}`, {
    "body": {
      "name": name,
      "value": arweaveURL
    },
    "headers": {
      "Authorization": `Bearer ${process.env.VERCEL_TOKEN}`
    },
    "method": "post"
  });

  return res.status(200).end("ok");
}

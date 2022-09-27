// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "octokit"

import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const octokit = new Octokit();
  const gist = await octokit.request(`GET /gists/${process.env.GIST_ID}`, {
    gist_id: process.env.GIST_ID
  });
  console.log(gist.data.files['immutableBaseUrl'].content);
}

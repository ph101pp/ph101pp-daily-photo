// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "octokit"

import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({req});

  const octokit = new Octokit({
    auth: token?.access_token
  })

  const gist = await octokit.request(`GET /gists/${process.env.GIST_ID}`, {
    gist_id: process.env.GIST_ID
  });

  await octokit.request(`PATCH /gists/${process.env.GIST_ID}`, {
    gist_id: process.env.GIST_ID,
    files: {
      'immutableBaseUrl': {
        content: req.query.gist
      }
    }
  });
    
}

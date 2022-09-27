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

  const gist = await octokit.request('GET /gists/24464e527cd21bc1fdd000ebd7b2b1a0', {
    gist_id: '24464e527cd21bc1fdd000ebd7b2b1a0'
  });

  console.log(gist.data.files['ph101ppManifest.txt'].content);

  await octokit.request('PATCH /gists/24464e527cd21bc1fdd000ebd7b2b1a0', {
    gist_id: '24464e527cd21bc1fdd000ebd7b2b1a0',
    description: 'An updated gist description',
    files: {
      'ph101ppManifest.txt': {
        content: req.query.gist
      }
    }
  });
    
}

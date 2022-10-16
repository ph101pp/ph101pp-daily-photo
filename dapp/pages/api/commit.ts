// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "@octokit/rest"
import { object, string } from "superstruct";

import type { NextApiRequest, NextApiResponse } from "next";
import genCommitToGithub from "../../utils/genCommitToGithub";
import { githubContext } from "../../utils/githubContext";

const paths = {
  manifest: "LATEST_MANIFEST.json",
  manifest_uri: "LATEST_MANIFEST_URI.txt"
}

const PostDataType = object({
  message: string(),
  manifest: string(),
  manifest_uri: string()
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if(req.method !== 'POST') {
    return res.status(405).end({ message: 'Only POST requests allowed' })
  }
  const params = req.body;
  if(!PostDataType.is(params)) {
    console.error(PostDataType.validate(params)[0]);
    return res.status(500).end({ message: 'Invalid request body.' })
  }
  const token = await getToken({req});
  const octokit = new Octokit({
    auth: token?.access_token
  });
  const changes= [
    {
      content: params.manifest,
      path: paths.manifest
    },
    {
      content: params.manifest_uri,
      path: paths.manifest_uri
    },
  ];
  await genCommitToGithub(octokit, githubContext, params.message, changes);
  return res.end("ok");
}

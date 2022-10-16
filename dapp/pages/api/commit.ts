// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "@octokit/rest"

import type { NextApiRequest, NextApiResponse } from "next";
import genCommitToGithub from "../../utils/genCommitToGithub";
import { githubContext } from "../../utils/githubContext";
import { CommitPostDataType } from "../../utils/CommitPostType";

const paths = {
  manifest: "LATEST_MANIFEST.json",
  manifest_uri: "LATEST_MANIFEST_URI.txt"
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if(req.method !== 'POST') {
    return res.status(405).end({ message: 'Only POST requests allowed' })
  }
  const params = JSON.parse(req.body);
  if(!CommitPostDataType.is(params)) {
    console.error(CommitPostDataType.validate(params)[0]);
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
    {
      content: params.tokenMetadata,
      path: `TOKEN_METADATA/${params.tokenId}.json`
    },
  ];
  await genCommitToGithub(octokit, githubContext, params.message, changes);
  return res.end("ok");
}

// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "@octokit/rest"
import { Base64 } from "js-base64";

import type { NextApiRequest, NextApiResponse } from "next";
import genCommitToGithub from "../../utils/genCommitToGithub";


const context = {
  owner: "greenish",
  repo: "ph101pp-daily-photo",
  branch: "test"
}

const changes= [
  {
    content:"manifest",
    path: "LATEST_MANIFEST.txt"
  },
  {
    content:"uri",
    path: "LATEST_MANIFEST_URI.txt"
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({req});
  const octokit = new Octokit({
    auth: token?.access_token
  });
  await genCommitToGithub(octokit, context, "LATEST_MANIFEST_URI.txt", changes);

  return res.end("ok");
}

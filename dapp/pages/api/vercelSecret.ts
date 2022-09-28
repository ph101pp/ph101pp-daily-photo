// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "@octokit/rest"
import { Base64 } from "js-base64";

import type { NextApiRequest, NextApiResponse } from "next";
import genUpdateLatestManifestUri from "../../utils/genUpdateGithubFile";
import genUpdateGithubFile from "../../utils/genUpdateGithubFile";

const owner = "greenish";
const repo = "ph101pp-daily-photo";
const path = "LATEST_MANIFEST_URI.txt";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({req});
  const octokit = new Octokit({
    auth: token?.access_token
  });
  const gist = await octokit.request(`GET /gists/${process.env.GIST_ID}`, {
    gist_id: process.env.GIST_ID
  });

  const arweaveURL = gist.data.files['latestManifestUri.txt'].content;

  await genUpdateGithubFile(octokit, "LATEST_MANIFEST_URI.txt", arweaveURL, "Update LATEST_MANIFEST_URI");
}

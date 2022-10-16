// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "@octokit/rest"

import type { NextApiRequest, NextApiResponse } from "next";
import { githubContext } from "../../utils/githubContext";


const path = "LATEST_MANIFEST.json";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({req});
  const octokit = new Octokit({
    auth: token?.access_token
  });
  return octokit.repos.getContent({
    owner: githubContext.owner,
    repo: githubContext.repo,
    ref: githubContext.branch,
    path,
  }).then(file => {
    if (Array.isArray(file.data)) {
      if (file.data[0].type === "file") {
        return file.data[0].content ?? null;
      }
    }
    else {
      if (file.data.type === "file") {
        return file.data.content ?? null;
      }
    }
    return null;
  })
  .then((manifestContent)=>{
    return manifestContent ? 
      res.json(JSON.parse(Buffer.from(manifestContent??"", "base64").toString())) :
      res.json(manifestContent)
  })
  .catch((e)=>{
    console.error("Failed to Fetch Manifest:", e);
    return res.status(404).end("Not Found")
  });
}

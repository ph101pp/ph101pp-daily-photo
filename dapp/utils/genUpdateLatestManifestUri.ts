// This is an example of to protect an API route
import type { Octokit } from "@octokit/rest"
import { Base64 } from "js-base64";

const owner = "greenish";
const repo = "ph101pp-daily-photo";
const path = "LATEST_MANIFEST_URI.txt";

export default async function updateLatestManifestUri(
  octokit: Octokit,
  newManifestUri: string
) {
  const {data: {sha}} = await octokit.request(`GET /repos/${owner}/${repo}/contents/${path}`, {
    owner,
    repo,
    path
  });

  return await octokit.repos.createOrUpdateFileContents({
    // replace the owner and email with your own details
    owner, 
    repo,
    path,
    sha,
    message: "Update LATEST_MANIFEST_URI",
    content: Base64.encode(newManifestUri),
    committer: {
      name: `Ph101pp`,
      email: "hello@philippadrian.com",
    },
    author: {
      name: `Ph101pp`,
      email: "hello@philippadrian.com",
    },
  });
}

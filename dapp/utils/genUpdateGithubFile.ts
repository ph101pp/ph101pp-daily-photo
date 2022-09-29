// This is an example of to protect an API route
import type { Octokit } from "@octokit/rest"
import { Base64 } from "js-base64";

const owner = "greenish";
const repo = "ph101pp-daily-photo";
//https://github.com/rossjrw/rossjrw/commit/f5640f4e75711ca98cf18064cde28dd0b2f2938d
export default async function genUpdateGithubFile(
  octokit: Octokit,
  path: string,
  content: string,
  message: string
) {
  const {data: {sha}} = await octokit.request(`GET /repos/${owner}/${repo}/contents/${path}`, {
    owner,
    repo,
    path
  });

  return await octokit.repos.createOrUpdateFileContents({
    owner, 
    repo,
    path,
    sha,
    message,
    content: Base64.encode(content),
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

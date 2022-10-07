import { Octokit } from "@octokit/rest";

type Change = {
  path: string
  content: string | null
}

type Context = {
  owner: string,
  repo: string,
  branch: string,
}

type File = {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'commit' | 'tree' | 'blob';
  sha?: string | null;
  content: string;
}

export default async function makeCommit(
  octokit: Octokit,
  context: Context,
  message: string,
  changes: Change[],
): Promise<void> {

  // Grab the SHA of the latest commit
  const remoteCommits = await octokit.repos.listCommits({
    owner: context.owner,
    repo: context.repo,
    per_page: 1,
  })
  let latestCommitSha = remoteCommits.data[0].sha
  const treeSha = remoteCommits.data[0].commit.tree.sha

  // Prepare files
  const files = changes.map((change) => ({
      path: change.path,
      content: change.content,
      type: "commit",
      mode: "100644", // file
    })) as File[]

  // Make a new tree for these changes
  const newTree = await octokit.git.createTree({
    owner: context.owner,
    repo: context.repo,
    base_tree: treeSha,
    tree: files,    
    message,
    parents: [latestCommitSha],
  })
  const newTreeSha = newTree.data.sha;

  const newCommit = await octokit.git.createCommit({
    owner: context.owner,
    repo: context.repo,
    message,
    tree: newTreeSha,
    parents: [latestCommitSha]
  })
  latestCommitSha = newCommit.data.sha

  // Set HEAD of branch to the new commit
  await octokit.git.updateRef({
    owner: context.owner,
    repo: context.repo,
    sha: latestCommitSha,
    ref: `heads/${context.branch}`,
  })
}
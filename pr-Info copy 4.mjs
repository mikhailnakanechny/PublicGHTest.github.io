import { Octokit } from "@octokit/rest";
// Initialize Octokit with your personal access token
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
// Replace with your repository owner and name
// const owner = 'owner';
// const repo = 'repository';
const owner = "mikhailnakanechny"; // Get the owner from the environment variable
const repo = "mikhailnakanechny.github.io"; // Get the repo from the environment variable
// List of allowed task prefixes in commit messages
const allowedPrefixList = [
  "feature",
  "task",
  "story",
  "fix",
  "bug",
  "release",
  "us",
];
const excludedPrefixList = [
  "Merge",
];

const OWNER = "mikhailnakanechny";
const REPO = "mikhailnakanechny.github.io";

// Main function to find branches containing the latest release commit
async function getBranchesWithLatestReleaseCommit() {
  try {
    // Fetch the latest release
    const { data: deployments } = await octokit.repos.listDeployments({
      owner: OWNER,
      repo: REPO,
      per_page: 3,
      page: 1,
    });

    const latestReleaseResponse = deployments[0];

    const latestCommitSha = latestReleaseResponse.sha;
    console.log('Latest Release Commit SHA:', latestCommitSha);

    // Fetch branches
    const branchesResponse = await octokit.repos.listBranches({
      owner: OWNER,
      repo: REPO
    });

    // Determine which branches contain the latest release commit
    const branchesWithCommit = [];
    for (const branch of branchesResponse.data) {
      const branchName = branch.name;
      const branchCommitSha = branch.commit.sha;

      // Compare branch commit SHA with the release commit SHA
      // Since we're looking for branches that might contain the commit, you can check if the branch is an ancestor
      if (await isAncestorOfCommit(latestCommitSha, branchName)) {
        branchesWithCommit.push(branchName);
      }
    }

    console.log('Branches containing the latest release commit:', branchesWithCommit);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Helper function to check if a branch contains a specific commit
async function isAncestorOfCommit(branchName, commitSha) {
  try {
    const comparisonResponse = await octokit.repos.compareCommits({
      owner: OWNER,
      repo: REPO,
      base: branchName,
      head: commitSha
    });

    // If the status is "behind", the branch is an ancestor of the commit
    return comparisonResponse.data.status === 'behind';
  } catch (error) {
    console.error(`Error comparing ${branchName} with commit ${commitSha}:`, error);
    return false;
  }
}

// Execute the main function
getBranchesWithLatestReleaseCommit();

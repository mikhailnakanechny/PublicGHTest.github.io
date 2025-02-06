import { Octokit } from "@octokit/rest";
// Initialize Octokit with your personal access token
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
// Replace with your repository owner and name
// const owner = 'owner';
// const repo = 'repository';
const owner = "mikhailnakanechny"; // Get the owner from the environment variable
const repo = "mikhailnakanechny.github.io"; // Get the repo from the environment variable
const allowedPrefixList = [
  "feature",
  "task",
  "story",
  "fix",
  "bug",
  "release",
  "us",
];

async function getCommitBySha(commitSha) {
  try {
    const response = await octokit.repos.getCommit({
      owner,
      repo,
      ref: commitSha,
    });

    console.log(response.data);
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    return '';
  }
}

async function getCommitMessagesFromLastDeployment() {
  try {
    // Fetch all deployments and sort them by creation date (descending)
    const { data: deployments } = await octokit.repos.listDeployments({
      owner,
      repo,
      per_page: 10,
      page: 1,
    });

    if (deployments.length < 2) {
      console.log(
        "To get the last deployment tickets info at least 2 deployments are required."
      );
      return;
    }

    const lastDeployment = deployments[0];
    const oldDeployment = deployments[1];
    const deploymentId = lastDeployment.id;

    // Fetch deployment statuses to check the status of the last deployment
    const { data: statuses } = await octokit.repos.listDeploymentStatuses({
      owner,
      repo,
      deployment_id: deploymentId,
    });

    // Check if the last deployment was successful
    const successful = statuses.some((status) => status.state === "success");

    if (!successful) {
      console.log("The last deployment was not successful.");
      return;
    }
    const ref = lastDeployment.sha;
    const refOld = oldDeployment.sha;

    // Fetch commits from the deployment ref
    const { data: commitsLast } = await octokit.repos.listCommits({
      owner,
      repo,
      sha: ref,
    });

    const { data: commitsOld } = await octokit.repos.listCommits({
      owner,
      repo,
      sha: refOld,
    });

    if (!commitsLast.length || !commitsOld.length) {
      console.log("There is no correct commits found.");
      return;
    }

    const shaCommitsLast = commitsLast.map((value) => {
      return value.sha;
    })

    const shaCommitsOld = commitsOld.map((value) => {
      return value.sha;
    });

    const uniqueCommitsSHA = [
      ...new Set([...shaCommitsLast, ...shaCommitsOld]),
    ];

    const uniqueCommits = [];
    commitsLast.forEach(commit => {
      if (uniqueCommitsSHA.includes(commit.sha)) {
        uniqueCommits.push(commit)
      }
    })

    console.log("Unique commits:");
    console.log(JSON.stringify(uniqueCommits));

    const uniqueCommitsList = [];

    uniqueCommitsSHA.forEach((commitSha) => {
      const commit = getCommitBySha(commitSha);
      uniqueCommitsList.push(commit);
    });

    const commitsNames = [];
    const taskNumbers = [];

    uniqueCommitsList.forEach((commit) => {
      const commitSplitdMsg = commit?.commit?.split(":");
      if (
        !!commitSplitdMsg && commitSplitdMsg.length > 1 &&
        allowedPrefixList.some((substring) =>
          commitSplitdMsg[0].includes(substring)
        )
      ) {
        commitsNames.push(commitSplitdMsg[0]);
        const splitTasksNumber = commitSplitdMsg[0].split("/");
        if (splitTasksNumber.length > 1) {
          taskNumbers.push(splitTasksNumber)[1];
        }
      }
    });
    console.log("Commits names:" + commitsNames);

    const uniqueTasksNumbers = Array.from(new Set(taskNumbers));
    console.log("Task numbers list:" + uniqueTasksNumbers);

  } catch (error) {
    console.error("Error fetching commit messages:", error);
  }
}

getCommitMessagesFromLastDeployment();

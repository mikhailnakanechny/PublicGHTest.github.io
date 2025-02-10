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
const excludedPrefixList = ["Merge"];

async function getCommitMessagesFromLastDeployment() {
  try {
    // Fetch all deployments and sort them by creation date (descending)
    const { data: deployments } = await octokit.repos.listDeployments({
      owner,
      repo,
      per_page: 3,
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

    //find unique commits
    const shaCommitsLast = commitsLast.map((value) => {
      return value.sha;
    });

    const shaCommitsOld = commitsOld.map((value) => {
      return value.sha;
    });

    const uniqueCommitsSHA = [
      ...new Set([...shaCommitsLast, ...shaCommitsOld]),
    ];

    const newCommitsSHA = uniqueCommitsSHA.filter(
      (item) => !shaCommitsOld.includes(item)
    );

    let uniqueCommits = [];
    commitsLast.forEach((commit) => {
      if (newCommitsSHA.includes(commit.sha)) {
        uniqueCommits.push(commit);
      }
    });

    //get tasks numbers from commits
    // const commitsNames = [];
    const taskNumbers = [];
    const regex = /^[a-zA-Z]{3,5}-\d{3,5}$/
    console.log("Commits messages:" + commitsNames);
    uniqueCommits.forEach((element) => {
      console.log("***" + element?.commit?.message);
      const commitSplitdMsg = element?.commit?.message?.split(":");
      if (
        !!commitSplitdMsg &&
        commitSplitdMsg.length > 1 &&
        !excludedPrefixList.some((substring) =>
          commitSplitdMsg[0].includes(substring)
        ) &&
        (allowedPrefixList.some((substring) =>
          commitSplitdMsg[0].includes(substring)
        ) ||
          regex.test(commitSplitdMsg[0]))
      ) {
        taskNumbers.push(splitTasksNumber[0]);
      }
    });

    console.log("Task numbers list:");
    const uniqueTasksNumbers = Array.from(new Set(taskNumbers));
    uniqueTasksNumbers.forEach((elem) => console.log(elem));
    return uniqueTasksNumbers;
  } catch (error) {
    console.error("Error fetching commit messages:", error);
  }
}

getCommitMessagesFromLastDeployment();

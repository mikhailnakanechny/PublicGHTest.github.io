import { Octokit } from '@octokit/rest';
// Initialize Octokit with your personal access token
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN }); // Get the repo token from the GHA environment variable

const owner = process.env.GITHUB_OWNER; // Get the owner from the GHA environment variable
const repo = process.env.GITHUB_REPO; // Get the repo from the GHA environment variable
// List of excluded words in commit messages
const excludedPrefixList = ['Merge'];

/**
 * Only for Github repositories. Retrieves commit messages from the last successful deployment and extracts task numbers.
 *
 * This function performs the following steps:
 * 1. Fetches the latest deployments from a GitHub repository and checks if there are at least two deployments.
 * 2. Determines the last successful deployment by examining deployment statuses.
 * 3. Retrieves commit differences between the last two deployments.
 * 4. Extracts unique commit SHAs and filters out duplicates.
 * 5. Parses commit messages to extract task numbers matching a specific pattern.
 * 6. Logs and returns a list of unique task numbers.
 *
 * @async
 * @function
 * @returns {Promise<Array<string>>} A promise that resolves to an array of unique task numbers extracted from commit messages.
 * @throws Will log an error message if any API call fails or if there are insufficient deployments.
 */
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
      console.log('To get the last deployment tickets info at least 2 deployments are required.');
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
    const successful = statuses.some((status) => status.state === 'success');
    if (!successful) {
      console.log('The last deployment was not successful.');
      return;
    }

    // Fetch commits from the deployment ref
    const ref = lastDeployment.sha;
    const refOld = oldDeployment.sha;
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
      console.log('There is no correct commits found.');
      return;
    }

    // find unique commits
    const shaCommitsLast = commitsLast.map((value) => {
      return value.sha;
    });
    const shaCommitsOld = commitsOld.map((value) => {
      return value.sha;
    });
    const uniqueCommitsSHA = [...new Set([...shaCommitsLast, ...shaCommitsOld])];
    const newCommitsSHA = uniqueCommitsSHA.filter((item) => !shaCommitsOld.includes(item));
    const uniqueCommits = [];
    commitsLast.forEach((commit) => {
      if (newCommitsSHA.includes(commit.sha)) {
        uniqueCommits.push(commit);
      }
    });

    // get tasks numbers from commits
    const taskNumbers = [];
    const regex = /^[A-Z]{2,6}-\d{1,6}$/;
    uniqueCommits.forEach((element) => {
      const commitSplitdMsg = element?.commit?.message?.split(':');
      if (
        !!commitSplitdMsg &&
        commitSplitdMsg.length > 1 &&
        !excludedPrefixList.some((substring) => commitSplitdMsg[0].includes(substring)) &&
        regex.test(commitSplitdMsg[0])
      ) {
        taskNumbers.push(commitSplitdMsg[0]);
      }
    });

    console.log('Task numbers list:');
    const uniqueTasksNumbers = Array.from(new Set(taskNumbers));
    uniqueTasksNumbers.forEach((elem) => console.log(elem));
    return uniqueTasksNumbers;
  } catch (error) {
    console.error('Error fetching commit messages:', error);
  }
}

getCommitMessagesFromLastDeployment();

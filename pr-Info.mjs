import { Octokit } from "@octokit/rest";

// Initialize Octokit with your personal access token

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });


// Replace with your repository owner and name
// const owner = 'owner';
// const repo = 'repository';

const owner = "mikhailnakanechny"; // Get the owner from the environment variable
const repo = "mikhailnakanechny.github.io"; // Get the repo from the environment variable

async function getDeployedPullRequests() {
  try {
    // Fetch all deployments
    const { data: deployments } = await octokit.repos.listDeployments({
      owner,
      repo,
    });

    const deployedPrs = [];

    for (const deployment of deployments) {
      const deploymentId = deployment.id;

      // Fetch deployment statuses to check if they are successful
      const { data: statuses } = await octokit.repos.listDeploymentStatuses({
        owner,
        repo,
        deployment_id: deploymentId,
      });

      const successful = statuses.some(status => status.state === 'success');
      
      if (successful) {
        const sha = deployment.sha;

        // Fetch pull requests associated with the deployment's commit
        const { data: pulls } = await octokit.repos.listPullRequestsAssociatedWithCommit({
          owner,
          repo,
          commit_sha: sha,
        });

        pulls.forEach(pr => {
          deployedPrs.push(`PR #${pr.number} - ${pr.title}`);
        });
      }
    }

    console.log("Deployed Pull Requests:");
    deployedPrs.forEach(pr => console.log(pr));
  } catch (error) {
    console.error("Error fetching deployed pull requests:", error);
  }
}

getDeployedPullRequests();
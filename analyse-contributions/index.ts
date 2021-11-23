import { calculateScore } from "./src/contribution-calculator";
import { formatScore } from "./src/formatter";
import GitHubClient from "./src/github-client";
import { Comment, Issue, PullRequest } from "./src/types";

(async () => {
  const { AUTH_TOKEN, FROM } = process.env;

  if (!AUTH_TOKEN || !FROM) {
    console.error("Please set the AUTH_TOKEN and FROM environment variable");
    process.exit(1);
  }

  const github = new GitHubClient(AUTH_TOKEN, new Date(FROM));
  
  // Make sure we can connect to the GitHub API
  await github.authenticate();

  const members = await github.readMembers();
  const pullRequests = await github.readPullRequests();
  const issues = await github.readIssues();
  const prComments: { pullRequest: PullRequest; comments: Comment[] }[] =
    await Promise.all(
      pullRequests.map((pullRequest: PullRequest) =>
        github.readPullRequestComments(pullRequest).then((comments) => ({
          pullRequest,
          comments,
        }))
      )
    );
  const issuesComments: { issue: Issue; comments: Comment[] }[] =
    await Promise.all(
      issues.map((issue: Issue) =>
        github
          .readIssueComments(issue)
          .then((comments) => ({ issue, comments }))
      )
    );
  const usersWithScore = await calculateScore({
    members,
    pullRequests,
    issues,
    prComments,
    issuesComments,
  });

  // sort users by total score
  const sortedUsers = usersWithScore
    .sort((a, b) => b.score.total - a.score.total)
    .filter(({ score }) => score.total > 0);

  // get sum of total scores
  const totalScore = sortedUsers
    .map(({ score: { total } }) => total)
    .reduce((a, b) => a + b, 0);

  formatScore(totalScore, sortedUsers);
})();

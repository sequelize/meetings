import { calculateScore, CalculatorInput } from "./src/contribution-calculator";
import { formatScore } from "./src/formatter";
import GitHubClient from "./src/github-client";
import { Comment, Issue, PullRequest, User } from "./src/types";

(async () => {
  const { AUTH_TOKEN, FROM } = process.env;

  if (!AUTH_TOKEN || !FROM) {
    console.error("Please set the AUTH_TOKEN and FROM environment variable");
    process.exit(1);
  }

  const github = new GitHubClient(AUTH_TOKEN, new Date(FROM));
  await github.authenticate();

  const calculatorInput = await getData(github);
  const usersWithScore = await calculateScore(calculatorInput);

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

const uniq = (users: User[]): User[] => {
  return users.reduce((acc, user) => {
    const userIds = acc.map((_user) => _user.id);
    if (!userIds.includes(user.id)) {
      acc.push(user);
    }

    return acc;
  }, [] as User[]);
};

async function getData(github: GitHubClient): Promise<CalculatorInput> {
  const pullRequests = await github.readPullRequests();
  const members = uniq([
    ...(await github.readMembers()),
    ...pullRequests.funded.map((pr) => pr.user),
  ]);
  const issues = await github.readIssues();
  const prComments: { pullRequest: PullRequest; comments: Comment[] }[] =
    await Promise.all(
      pullRequests.all.map((pullRequest: PullRequest) =>
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

  return {
    members,
    pullRequests,
    issues,
    prComments,
    issuesComments,
  };
}

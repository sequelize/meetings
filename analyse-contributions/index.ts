import { calculateScore, CalculatorInput } from "./src/contribution-calculator";
import { formatScore } from "./src/formatter";
import GitHubClient from "./src/github-client";
import {Comment, User} from "./src/types";

(async () => {
  const { AUTH_TOKEN, QUARTER, BALANCE } = process.env;

  if (!AUTH_TOKEN || !QUARTER || !BALANCE || !Number(BALANCE)) {
    console.error(
      "Please set the AUTH_TOKEN, QUARTER (YYYY-Q1, YYYY-Q2, YYYY-Q3 or YYYY-Q4, e.g. 2022-Q1) and BALANCE environment variable"
    );
    process.exit(1);
  }

  const match = QUARTER.match(/^(\d{4})-Q([1-4])$/);
  if (match == null) {
    console.log(`Quarter syntax is invalid, should follow this format: YYYY-Qx (e.g. 2022-Q1 for january to march 2022)`);
  }

  const year: string = match![1];
  const quarter = Number(match![2]);

  let from: Date;
  let to: Date;
  switch (quarter) {
    case 1:
      from = new Date(`${year}-01-01`);
      to = new Date(`${year}-03-31`);
      break;

    case 2:
      from = new Date(`${year}-04-01`);
      to = new Date(`${year}-06-30`);
      break;

    case 3:
      from = new Date(`${year}-07-01`);
      to = new Date(`${year}-09-30`);
      break;

    case 4:
      from = new Date(`${year}-10-01`);
      to = new Date(`${year}-12-31`);
      break;

    default:
      throw new Error('Invalid quarter, must be a number between 1 and 4');
  }

  const github = new GitHubClient(AUTH_TOKEN, from, to);
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

  formatScore(Number(BALANCE), totalScore, sortedUsers);
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
  // reward merged pull requests
  const pullRequests = await github.readPullRequests();
  const members = uniq([
    ...(await github.readMembers()),
    ...pullRequests.funded.map((pr) => pr.user),
  ]);
  const newIssues: any[] = await github.readCreatedIssues();
  const comments: Comment[] = [
    ...await github.readCreatedComments(),
    ...await github.readCreatedReviews(),
  ]

  return {
    members,
    pullRequests,
    issues: newIssues,
    comments,
  };
}

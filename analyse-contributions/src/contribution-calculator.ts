import { FUNDED_LABEL, FUNDED_MULTIPLIER, PR_MULTIPLIER } from "./config";
import { Comment, Issue, PullRequest, User } from "./types";

export type CalculatorInput = {
  members: User[];
  pullRequests: PullRequest[];
  issues: Issue[];
  prComments: { pullRequest: PullRequest; comments: Comment[] }[];
  issuesComments: { issue: Issue; comments: Comment[] }[];
};

function byMember(member: User) {
  return function (collection: PullRequest | Issue | Comment) {
    return collection.user.login === member.login;
  };
}

export type Score = {
  total: number;
  pullRequests: number;
  issueComments: number;
  prComments: number;
  issues: number;
};

export type Contributions = {
  pullRequests: PullRequest[];
  issueComments: { issue: Issue; comments: Comment[] }[];
  prComments: { pullRequest: PullRequest; comments: Comment[] }[];
  issues: Issue[];
};

export type UserContributions = {
  user: User;
  score: Score;
  contributions: Contributions;
};

export async function calculateScore({
  members,
  pullRequests,
  issues,
  prComments,
  issuesComments,
}: CalculatorInput): Promise<UserContributions[]> {
  return Promise.all(
    members.map(async (user: User) => {
      const memberPullRequests = pullRequests.filter(byMember(user));
      const memberIssueComments = issuesComments.filter(({ comments }) => {
        return comments.some(byMember(user));
      });
      const memberPrComments = prComments.filter(({ comments }) => {
        return comments.some(byMember(user));
      });
      const memberIssues = issues.filter(byMember(user));
      const contributions: Contributions = {
        pullRequests: memberPullRequests,
        issueComments: memberIssueComments,
        prComments: memberPrComments,
        issues: memberIssues,
      };
      const fundedPullRequests = contributions.pullRequests.filter((pr) =>
        pr.labels.some((label) => label.name === FUNDED_LABEL)
      );
      const normalPullRequests = contributions.pullRequests.filter(
        (pr) => !fundedPullRequests.includes(pr)
      );

      const _score: Omit<Score, "total"> = {
        pullRequests:
          normalPullRequests.length * PR_MULTIPLIER +
          fundedPullRequests.length * FUNDED_MULTIPLIER,
        issueComments: contributions.issueComments.length,
        prComments: contributions.prComments.length,
        issues: contributions.issues.length,
      };
      const score: Score = {
        ..._score,
        total: Object.values(_score).reduce((a, b) => a + b, 0),
      };

      return {
        user,
        contributions,
        score,
      };
    })
  );
}

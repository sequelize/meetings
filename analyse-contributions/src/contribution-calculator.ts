import { FUNDED_LABEL, FUNDED_MULTIPLIER, PR_MULTIPLIER } from "./config";
import { GroupedPullRequests } from "./github-client";
import { Comment, Issue, PullRequest, User } from "./types";

export type CalculatorInput = {
  members: User[];
  pullRequests: GroupedPullRequests;
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
      const memberPullRequests = pullRequests.all.filter(byMember(user));
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

      const _score: Omit<Score, "total"> = {
        pullRequests:
          pullRequests.normal.filter(byMember(user)).length * PR_MULTIPLIER +
          pullRequests.funded.filter(byMember(user)).length * FUNDED_MULTIPLIER,
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

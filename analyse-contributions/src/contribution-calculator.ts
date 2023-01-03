import {FUNDED_MULTIPLIER, ISSUE_MULTIPLIER, PR_MULTIPLIER} from "./config";
import { GroupedPullRequests } from "./github-client";
import { Comment, Issue, PullRequest, User } from "./types";

export type CalculatorInput = {
  members: User[];
  pullRequests: GroupedPullRequests;
  issues: Issue[];
  comments: Comment[];
};

function byMember(member: User) {
  return function (collection: PullRequest | Issue | Comment) {
    return collection.user.login === member.login;
  };
}

export type Score = {
  total: number;
  pullRequests: number;
  comments: number;
  issues: number;
};

export type Contributions = {
  pullRequests: PullRequest[];
  comments: string[];
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
  comments,
}: CalculatorInput): Promise<UserContributions[]> {
  return members.map((user: User) => {
    const memberPullRequests = pullRequests.all.filter(byMember(user));
    const memberIssueComments = comments.filter(byMember(user));
    const memberIssues = issues.filter(byMember(user));
    const contributions: Contributions = {
      pullRequests: memberPullRequests,
      comments: memberIssueComments.map((comment) => comment.html_url),
      issues: memberIssues,
    };

    const _score: Omit<Score, "total"> = {
      pullRequests:
        pullRequests.normal.filter(byMember(user)).length * PR_MULTIPLIER +
        pullRequests.funded.filter(byMember(user)).length * FUNDED_MULTIPLIER,
      comments: contributions.comments.length,
      issues: contributions.issues.length * ISSUE_MULTIPLIER,
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
  });
}

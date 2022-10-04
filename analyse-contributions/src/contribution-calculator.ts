import { Comment, Issue, PullRequest, Review, User } from "./types";

type CalculatorParams = {
  members: User[];
  pullRequests: PullRequest[];
  issues: Issue[];
  prComments: { pullRequest: PullRequest; comments: Comment[] }[];
  issuesComments: { issue: Issue; comments: Comment[] }[];
  prReviews: { pullRequest: PullRequest; reviews: Review[] }[];
};

function byMember(member: User) {
  return function (collection: PullRequest | Issue | Comment) {
    return collection.user.login === member.login;
  };
}

export type UserContributions = {
  user: User;
  score: {
    total: number;
    pullRequests: number;
    issueComments: number;
    prComments: number;
    issues: number;
    prReviews: number;
  };
  contributions: {
    pullRequests: PullRequest[];
    issueComments: { issue: Issue; comments: Comment[] }[];
    prComments: { pullRequest: PullRequest; comments: Comment[] }[];
    issues: Issue[];
    reviews: { pullRequest: PullRequest; reviews: Review[] }[];
  };
};

const FUNDED_LABEL = "funded";
const FUNDED_MULTIPLIER = 10;

export async function calculateScore({
  members,
  pullRequests,
  issues,
  prComments,
  issuesComments,
  prReviews,
}: CalculatorParams): Promise<UserContributions[]> {
  return Promise.all(
    members.map(async (user: User) => {
      const memberPullRequests = pullRequests.filter(byMember(user));
      const memberIssueComments = issuesComments.filter(({ comments }) => {
        return comments.some(byMember(user));
      });
      const memberPrComments = prComments.filter(({ comments }) => {
        return comments.some(byMember(user));
      });
      const memberPrReviews = prReviews.filter(({ reviews }) => {
        return reviews.some(byMember(user));
      });
      const memberIssues = issues.filter(byMember(user));
      const contributions = {
        pullRequests: memberPullRequests,
        issueComments: memberIssueComments,
        prComments: memberPrComments,
        issues: memberIssues,
        reviews: memberPrReviews,
      };
      const fundedPullRequests = contributions.pullRequests.filter((pr) =>
        pr.labels.some((label) => label.name === FUNDED_LABEL)
      );
      const normalPullRequests = contributions.pullRequests.filter(
        (pr) => !fundedPullRequests.includes(pr)
      );

      const score = {
        pullRequests:
          normalPullRequests.length * 2 +
          fundedPullRequests.length * FUNDED_MULTIPLIER,
        issueComments: contributions.issueComments.length,
        prComments: contributions.prComments.length,
        issues: contributions.issues.length,
        prReviews: contributions.reviews.length,
      };

      return {
        user,
        contributions,
        score: {
          ...score,
          total: Object.values(score).reduce((a, b) => a + b, 0),
        },
      };
    })
  );
}

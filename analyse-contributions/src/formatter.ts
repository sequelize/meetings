import { UserContributions } from "./contribution-calculator";

export function formatScore(
  totalScore: number,
  userContributions: UserContributions[]
) {
  userContributions.forEach(({ user, contributions, score }) => {
    console.log();
    console.log(user.login);
    console.log("-".repeat(user.login.length));

    console.log();
    console.log("Pull Requests");
    contributions.pullRequests.forEach((pr) => {
      console.log(`- ${pr.title} (${pr._links.html.href})`);
    });

    console.log();
    console.log("Issues");
    contributions.issues.forEach((issue) => {
      console.log(`- ${issue.title} (${issue.html_url})`);
    });

    console.log();
    console.log("Comments on Pull Requests");
    contributions.prComments.forEach(({ pullRequest }) => {
      console.log(`- ${pullRequest.title} (${pullRequest._links.html.href})`);
    });

    console.log();
    console.log("Comments on Issues");
    contributions.issueComments.forEach(({ issue }) => {
      console.log(`- ${issue.title} (${issue.html_url})`);
    });

    console.log();
    console.log("Reviews of Pull Requests");
    contributions.reviews.forEach(({ pullRequest }) => {
      console.log(`- ${pullRequest.title} (${pullRequest._links.html.href})`);
    });
  });

  console.log("\nOverall stats");
  console.log("-".repeat(13));
  userContributions.forEach(({ user, score }) => {
    const share = ~~((score.total / totalScore) * 100);
    const points = [
      `total: ${score.total}`,
      `pr: ${score.pullRequests}`,
      `issues: ${score.issues}`,
      `reviews: ${score.prReviews}`,
      `comments: ${score.issueComments + score.prComments}`,
    ];

    console.log(`${user.login}: ${share}% (${points.join(", ")})`);
  });
}

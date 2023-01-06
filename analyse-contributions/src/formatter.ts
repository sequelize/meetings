import { UserContributions } from "./contribution-calculator";

export function formatScore(
  balance: number,
  totalScore: number,
  userContributions: UserContributions[]
) {
  userContributions.forEach(({ user, contributions, score }) => {
    console.log();
    console.log(user.login);
    console.log("-".repeat(user.login.length));

    if (contributions.pullRequests.length > 0) {
      console.log();
      console.log("Pull Requests");
      contributions.pullRequests.forEach((pr) => {
        console.log(`- ${pr.title} (${pr.pull_request.html_url})`);
      });
    }

    if (contributions.issues.length > 0) {
      console.log();
      console.log("Issues");
      contributions.issues.forEach((issue) => {
        console.log(`- ${issue.title} (${issue.html_url})`);
      });
    }

    if (contributions.comments.length > 0) {
      console.log();
      console.log("Comments on Issues & PRs");
      contributions.comments.forEach(url => {
        console.log(`- ${url}`);
      });
    }
  });

  console.log("\nOverall stats");
  console.log("-".repeat(13));
  userContributions.forEach(({ user, score }) => {
    const share = score.total / totalScore;
    const sharePercentage = ~~(share * 100);
    const points = [
      `total: ${score.total}`,
      `pr: ${score.pullRequests}`,
      `issues: ${score.issues}`,
      `comments: ${score.comments}`,
    ];
    const usd = (share * balance).toFixed(2);

    console.log(
      `${user.login}: ${sharePercentage}% / ${usd} USD (${points.join(", ")})`
    );
  });
}

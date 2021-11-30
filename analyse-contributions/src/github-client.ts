import { Octokit } from "octokit";
import { readCollection } from "./github-helper";
import { Comment, Issue, PullRequest } from "./types";

const RELEVANT_REPOSITORIES = ["sequelize", "cli", "umzug"];

export default class GitHubClient {
  private octokit: Octokit;
  private from: Date;
  private org: string = "sequelize";

  constructor(token: string, from: Date) {
    this.octokit = new Octokit({
      auth: token,
    });
    this.from = from;
  }

  async authenticate() {
    const { data } = await this.octokit.rest.users.getAuthenticated();

    return data;
  }

  async readMembers() {
    const { data } = await this.octokit.rest.orgs.listMembers({
      org: this.org,
    });

    return data;
  }

  readPullRequests(): Promise<PullRequest[]> {
    return Promise.all(
      RELEVANT_REPOSITORIES.map((repo: string) =>
        readCollection<PullRequest>(this.from, this.octokit.rest.pulls.list, {
          owner: this.org,
          repo,
          state: "closed",
        })
      )
    ).then((results) => results.flat(1));
  }

  readIssues(): Promise<Issue[]> {
    return Promise.all(
      RELEVANT_REPOSITORIES.map((repo: string) =>
        readCollection<Issue>(this.from, this.octokit.rest.issues.list, {
          owner: this.org,
          repo,
          state: "closed",
        })
      )
    ).then((results) => results.flat(1));
  }

  async readPullRequestComments(pullRequest: PullRequest) {
    // example url https://api.github.com/repos/sequelize/sequelize/issues/13611/comments
    const match = pullRequest.comments_url.match(
      /repos\/(.*)\/(.*)\/issues\/(\d*)\/comments/
    );

    if (!match) {
      return [];
    }

    const owner: string = match[1];
    const repo: string = match[2];
    const pull_number: string = match[3];

    return readCollection(
      this.from,
      this.octokit.rest.pulls.listReviewComments,
      {
        owner,
        repo,
        pull_number,
      }
    );
  }

  async readIssueComments(issue: Issue): Promise<Comment[]> {
    // example url https://api.github.com/repos/sequelize/sequelize/issues/13712/comments
    const match = issue.comments_url.match(
      /repos\/(.*)\/(.*)\/issues\/(\d*)\/comments/
    );

    if (!match) {
      return [];
    }

    const owner: string = match[1];
    const repo: string = match[2];
    const issue_number: string = match[3];

    return readCollection(this.from, this.octokit.rest.issues.listComments, {
      owner,
      repo,
      issue_number,
    });
  }
}

import { Octokit } from "octokit";
import { readCollection } from "./github-helper";
import { Comment, Issue, PullRequest } from "./types";

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
    return readCollection(this.from, this.octokit.rest.pulls.list, {
      owner: this.org,
      repo: "sequelize",
      state: "closed",
    });
  }

  readIssues(): Promise<Issue[]> {
    return readCollection(this.from, this.octokit.rest.issues.list, {
      owner: this.org,
      repo: "sequelize",
      state: "closed",
    });
  }

  readPullRequestComments(pullRequest: PullRequest) {
    return readCollection(
      this.from,
      this.octokit.rest.pulls.listReviewComments,
      {
        owner: this.org,
        repo: "sequelize",
        pull_number: pullRequest.number,
      }
    );
  }

  readIssueComments(issue: Issue): Promise<Comment[]> {
    return readCollection(this.from, this.octokit.rest.issues.listComments, {
      owner: this.org,
      repo: "sequelize",
      issue_number: issue.number,
    });
  }
}

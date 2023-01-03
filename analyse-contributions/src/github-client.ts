import { Octokit } from "octokit";
import { FUNDED_LABEL } from "./config";
import {readCollection, readSearch} from "./github-helper";
import {Comment, Issue, PullRequest} from "./types";

export type GroupedPullRequests = {
  normal: PullRequest[];
  funded: PullRequest[];
  all: PullRequest[];
};
export default class GitHubClient {
  private octokit: Octokit;
  private from: Date;
  private to: Date;
  private org: string = "sequelize";

  constructor(token: string, from: Date, to: Date) {
    this.octokit = new Octokit({
      auth: token,
    });
    this.from = from;
    this.to = to;
  }

  async authenticate() {
    const { data } = await this.octokit.rest.users.getAuthenticated();

    return data;
  }

  // TODO: memoize
  async readRepositories() {
    const { data } = await this.octokit.rest.repos.listForOrg({
      org: this.org,
    });

    return data;
  }

  async readMembers() {
    const { data } = await this.octokit.rest.orgs.listMembers({
      org: this.org,
    });

    return data;
  }

  async readPullRequests(): Promise<GroupedPullRequests> {
    const isFunded = (pr: PullRequest) =>
      pr.labels.some((label) => label.name === FUNDED_LABEL);

    const pullRequests = await readSearch<PullRequest>(this.octokit.rest.search.issuesAndPullRequests, {
      q: `type:pr+org:${this.org}+merged:${toIsoDateOnly(this.from)}..${toIsoDateOnly(this.to)}+is:merged`,
    });

    const funded = pullRequests.filter(isFunded);
    const normal = pullRequests.filter((pr) => !funded.includes(pr));

    return { funded, normal, all: pullRequests };
  }

  async readCreatedIssues(): Promise<Issue[]> {
    // reward creating bug report & feature requests
    const issues = await readSearch<Issue>(this.octokit.rest.search.issuesAndPullRequests, {
      q: `type:issue+org:${this.org}+created:${toIsoDateOnly(this.from)}..${toIsoDateOnly(this.to)}`,
    });

    // but ignore duplicates, invalid or rejected issues.
    return issues.filter(issue => {
      return issue.state_reason !== 'not_planned';
    });
  }

  async readUpdatedIssues(): Promise<Issue[]> {
    return await readSearch<Issue>(this.octokit.rest.search.issuesAndPullRequests, {
      q: `type:issue+org:${this.org}+updated:${toIsoDateOnly(this.from)}..${toIsoDateOnly(this.to)}`,
    });
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

  async readCreatedComments(): Promise<Comment[]> {
    const repositories = await this.readRepositories();

    const comments = await Promise.all(
      repositories.map(async (repo) => {
        return await readCollection<Comment>(this.from, this.octokit.rest.issues.listCommentsForRepo, {
          owner: this.org,
          repo: repo.name,
          since: toIsoDateOnly(this.from),
        });
      }
    )).then((comments) => comments.flat(1));

    return comments.filter(comment => {
      const createdAt = new Date(comment.created_at);
      return createdAt >= this.from && createdAt <= this.to;
    })
  }
}

function toIsoDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

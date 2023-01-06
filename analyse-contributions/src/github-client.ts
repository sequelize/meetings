import { Octokit } from "octokit";
import { FUNDED_LABEL } from "./config";
import { readCollection, readSearch } from "./github-helper";
import { Comment, Issue, PullRequest, Repository } from "./types";
import { groupBy } from "lodash";

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
  private async _readRepositories(): Promise<Repository[]> {
    const { data } = await this.octokit.rest.repos.listForOrg({
      org: this.org,
    });

    return data;
  }

  _readRepositoriesMemoized: Promise<Repository[]> | undefined;
  readRepositories() {
    this._readRepositoriesMemoized ??= this._readRepositories();

    return this._readRepositoriesMemoized;
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

  async readCreatedComments(): Promise<Comment[]> {
    const repositories = await this.readRepositories();

    const repoComments = await Promise.all(
      repositories.map(async (repo) => {
        return await readCollection<Comment>(this.from, this.octokit.rest.issues.listCommentsForRepo, {
          owner: this.org,
          repo: repo.name,
          since: toIsoDateOnly(this.from),
        });
      }
    ));

    const comments = repoComments.flat(1).filter(comment => {
      const createdAt = new Date(comment.created_at);
      return createdAt >= this.from && createdAt <= this.to;
    })

    // consecutive comments only count as 1, unless they have been separated by 24 hours
    const deduplicatedComments: Comment[] = [];
    const commentThreads: Record<string, Comment[]> = groupBy(comments, comment => comment.issue_url);
    for (const thread of Object.values(commentThreads)) {
      thread.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      deduplicatedComments.push(thread[0]);

      for (let i = 1; i < thread.length; i++) {
        const previousComment = thread[i - 1];
        const currentComment = thread[i];
        if (previousComment.user.login !== currentComment.user.login) {
          deduplicatedComments.push(currentComment);
          continue;
        }

        const diff = new Date(currentComment.created_at).getTime() - new Date(previousComment.created_at).getTime();
        if (diff >= 24 * 60 * 60 * 1000) {
          deduplicatedComments.push(currentComment);
        }
      }
    }

    return deduplicatedComments;
  }

  async readCreatedReviews(): Promise<Comment[]> {
    const repositories = await this.readRepositories();

    const repoReviews = await Promise.all(
      repositories.map(async (repo) => {
          return await readCollection<Comment>(this.from, this.octokit.rest.pulls.listReviewCommentsForRepo, {
            owner: this.org,
            repo: repo.name,
            since: toIsoDateOnly(this.from),
          });
        }
      ));

    return repoReviews.flat(1).filter(comment => {
      const createdAt = new Date(comment.created_at);
      return createdAt >= this.from && createdAt <= this.to;
    });
  }
}

function toIsoDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

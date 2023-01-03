export type Timestamps = {
  created_at: string;
  updated_at: string;
  closed_at?: string;
};

export type PullRequest =
  Timestamps & {
    pull_request: {
      html_url: string;
    },
    user: User;
    number: number;
    title: string;
    comments_url: string;
    head: {
      repo: Repository;
    };
    labels: Label[];
  };

export type Label = {
  id: number;
  url: string;
  name: string;
  color: string;
  default: boolean;
  description: string;
};

export type Issue = Timestamps & {
  id: number;
  user: User;
  number: number;
  title: string;
  comments_url: string;
  comments: number;
  html_url: string;
  state_reason: 'completed' | 'not_planned' | 'reopened' | null;
  head: {
    repo: Repository;
  };
};

export type User = {
  login: string;
  id: number;
};

export type Comment = Timestamps & {
  user: User;
  html_url: string;
  issue_url: string;
};

export type Repository = {
  name: string;
};

export type Link = {
  href: string;
};

export type Links = {
  _links: {
    html: Link;
  };
};

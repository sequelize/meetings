export type Timestamps = {
  created_at: string;
  updated_at: string;
  closed_at?: string;
};

export type PullRequest = Links &
  Timestamps & {
    user: User;
    number: number;
    title: string;
    comments_url: string;
    head: {
      repo: Repository;
    };
  };

export type Issue = Timestamps & {
  user: User;
  number: number;
  title: string;
  comments_url: string;
  html_url: string;
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

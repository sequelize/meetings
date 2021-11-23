export type Timestamps = {
  created_at: string;
  updated_at: string;
  closed_at?: string;
};

export type PullRequest = Timestamps & {
  user: User;
  number: number;
  title: string;
};

export type Issue = Timestamps & {
  user: User;
  number: number;
  title: string;
};

export type User = {
  login: string;
  id: number;
};

export type Comment = Timestamps & {
  user: User;
};

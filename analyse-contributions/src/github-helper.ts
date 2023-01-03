import { Comment, Issue, PullRequest } from "./types";

export async function readSearch<T extends PullRequest | Issue | Comment>(
  fun: Function,
  args: Object,
  acc: T[] = [],
  page = 1
): Promise<T[]> {
  const response = await fun({
    ...args,
    per_page: 100,
    page,
  });

  const items = [...acc, ...response.data.items];

  if (response.data.items.length < 100) {
    return items;
  }

  return readSearch(fun, args, items, page + 1);
}


export async function readCollection<T extends PullRequest | Issue | Comment>(
  from: Date,
  fun: Function,
  args: Object,
  acc: T[] = [],
  page = 1
): Promise<T[]> {
  const { data: _collection }: { data: T[] } = await fun({
    ...args,
    per_page: 100,
    page,
  });

  const collection: T[] = _collection.filter(
    (entity: T) => new Date(entity.closed_at || entity.updated_at) > from
  );

  if (collection.length < 100) {
    return acc.concat(collection);
  }

  return readCollection(from, fun, args, acc.concat(collection), page + 1);
}

import { Comment, Issue, PullRequest, Review } from "./types";

export async function readCollection<
  T extends PullRequest | Issue | Comment | Review
>(
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

  const collection: T[] = _collection.filter((entity: T) => {
    const date = entity.closed_at || entity.updated_at || entity.submitted_at;
    return new Date(date!) > from;
  });

  if (collection.length < 100) {
    return acc.concat(collection);
  }

  return readCollection(from, fun, args, acc.concat(collection), page + 1);
}

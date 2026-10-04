type Cached<T> = { value: T };

const reads = new Map<string, Cached<unknown>>();
const pending = new Map<string, Promise<unknown>>();
const MAX_ENTRIES = 500;

/**
 * Remembers a read until `invalidateReads` drops it.
 * Concurrent callers for the same key share one database call.
 * Dropping the oldest entry only forgets it; the next read loads again.
 */
export async function readThrough<T>(
  key: string,
  load: () => Promise<T>
): Promise<T> {
  const cached = reads.get(key) as Cached<T> | undefined;
  if (cached) {
    return cached.value;
  }

  const existing = pending.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = load()
    .then((value) => {
      remember(key, value);
      return value;
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, promise);
  return promise;
}

export function invalidateReads(prefix: string): void {
  for (const key of Array.from(reads.keys())) {
    if (key.startsWith(prefix)) {
      reads.delete(key);
    }
  }
  for (const key of Array.from(pending.keys())) {
    if (key.startsWith(prefix)) {
      pending.delete(key);
    }
  }
}

/** Drops every cached view of one project. */
export function invalidateProjectReads(projectId: string): void {
  invalidateReads(`dashboard:${projectId}:`);
  invalidateReads(`environments:${projectId}`);
  invalidateReads(`project:${projectId}:`);
  invalidateReads(`flags:${projectId}:`);
}

function remember(key: string, value: unknown): void {
  if (reads.size >= MAX_ENTRIES && !reads.has(key)) {
    const oldest = reads.keys().next().value;
    if (oldest) {
      reads.delete(oldest);
    }
  }
  reads.set(key, { value });
}

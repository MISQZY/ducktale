/**
 * Generic in-memory TTL cache for DB-query results, following the same
 * Map + fetchedAt shape as the external-ping cache in `src/lib/mcsrvstat.ts`.
 * Safe here specifically because the app runs as a persistent
 * `output: standalone` Node process (see Dockerfile), not serverless/edge —
 * module scope survives across requests, so this doesn't reset per-invocation
 * the way it would on a cold-starting platform.
 */

interface CacheEntry<T> {
  data:      T;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = store.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  if (cached && now - cached.fetchedAt < ttlMs) {
    return cached.data;
  }

  const data = await fetcher();
  store.set(key, { data, fetchedAt: now });
  return data;
}

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

// Cap so unique cache keys (e.g. one-off player search terms) can't grow
// this map forever — a plain Map, so insertion order doubles as recency
// order and the oldest (first) key is always the eviction candidate.
const MAX_ENTRIES = 500;

const store = new Map<string, CacheEntry<unknown>>();

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = store.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  if (cached && now - cached.fetchedAt < ttlMs) {
    // Re-insert to move this key to the most-recently-used end.
    store.delete(key);
    store.set(key, cached);
    return cached.data;
  }

  const data = await fetcher();
  store.delete(key);
  store.set(key, { data, fetchedAt: now });

  if (store.size > MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) store.delete(oldestKey);
  }

  return data;
}

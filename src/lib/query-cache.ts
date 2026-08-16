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
// order and the oldest (first) key is always the eviction candidate. Shared
// by every withCache() caller in the app (skins, leaderboard pages, guest/
// effective-role resolution, online-players, ...) — 500 was low enough that
// under real traffic, short-lived high-churn keys (e.g. one per leaderboard
// page/sort/search combo) evicted long-TTL entries like 10-minute skin
// lookups well before their TTL, forcing them back to a DB round trip.
// Entries are small (strings/short arrays), so a much higher cap costs
// little memory for a lot fewer forced re-fetches.
const MAX_ENTRIES = 5000;

const store = new Map<string, CacheEntry<unknown>>();

// Fetches currently in flight, keyed the same as `store`. Without this, a
// burst of near-simultaneous callers for the same not-yet-cached key (e.g.
// someone reloading a page repeatedly before the previous load finishes)
// would each see a cache miss and independently call `fetcher`, hitting the
// database once per caller instead of once total — a TTL cache alone
// doesn't prevent that, since it only starts helping once the first call
// has actually finished and written a result.
const inFlight = new Map<string, Promise<unknown>>();

/**
 * True if `key` has a currently-valid cached entry, without touching it (no
 * LRU re-insertion, no fetch). Lets a caller decide whether a request would
 * actually reach the database *before* spending it against a rate limit —
 * a request that's going to be served from cache shouldn't count the same
 * as one that's about to hit the database.
 */
export function hasFreshCache(key: string, ttlMs: number): boolean {
  const cached = store.get(key);
  return cached !== undefined && Date.now() - cached.fetchedAt < ttlMs;
}

/**
 * Drops every cached entry whose key starts with `prefix` — for the rare
 * case a write needs to bust a cache that's otherwise purely TTL-driven
 * (e.g. leaderboard entries keyed by page/search/sort, all sharing a
 * "leaderboard:" prefix). `revalidatePath` doesn't reach this cache — it's
 * a plain in-memory Map, not Next's own data/router cache — so callers that
 * need the *next* request to see a change have to clear it explicitly.
 */
export function invalidateByPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

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

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = fetcher()
    .then((data) => {
      store.delete(key);
      store.set(key, { data, fetchedAt: Date.now() });

      if (store.size > MAX_ENTRIES) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) store.delete(oldestKey);
      }

      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

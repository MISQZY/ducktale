import { siteDb } from "@/lib/site-db";
import { withCache, invalidateByPrefix } from "@/lib/query-cache";

/**
 * Site-presence tracking ("is this account currently browsing the site",
 * distinct from the Minecraft-server online flag in player-card.ts). Two
 * in-memory Maps, pinned to globalThis for the same reason as site-db.ts's
 * PrismaClient singleton: a plain module-level `const` can end up
 * re-instantiated (Turbopack dev-mode bundles route handlers separately, and
 * HMR re-evaluates modules on save), which would silently split this into
 * multiple independent Maps — recordHeartbeat() writing to one instance
 * while isUserOnline() reads a different, permanently-empty one. globalThis
 * survives that; a bare module scope doesn't reliably.
 *
 * "Online right now" is answered entirely from `lastSeenMemory` — no DB
 * read at all. The DB column (User.lastSeenAt) only exists so an *offline*
 * user still has a meaningful last-seen time, and to survive a process
 * restart — it's written at most once per PERSIST_MIN_INTERVAL_MS per user,
 * not on every heartbeat, so a user idling on the site for an hour with a
 * heartbeat every 60s produces on the order of 1 write every 2 minutes, not
 * 60 writes.
 */

const ONLINE_THRESHOLD_MS = 2 * 60_000; // last heartbeat must be within this to count as "online"
const PERSIST_MIN_INTERVAL_MS = 2 * 60_000; // floor between DB writes of lastSeenAt, per user
const ACCOUNT_LINK_TTL_MS = 60_000; // uuid -> userId/lastSeenAt lookup cache for the read side

// Cap so an unbounded number of distinct users (or a restart-less very long
// uptime) can't grow these forever — same eviction shape as query-cache.ts.
const MAX_ENTRIES = 5000;

const globalForPresence = globalThis as unknown as {
  presenceLastSeenMemory?: Map<string, number>;
  presenceLastPersisted?: Map<string, number>;
};

// userId -> ms epoch, source of truth for "online now"
const lastSeenMemory = globalForPresence.presenceLastSeenMemory ?? new Map<string, number>();
// userId -> ms epoch of last successful DB write (write-throttle only)
const lastPersisted = globalForPresence.presenceLastPersisted ?? new Map<string, number>();

globalForPresence.presenceLastSeenMemory = lastSeenMemory;
globalForPresence.presenceLastPersisted = lastPersisted;

function evictIfNeeded<K>(map: Map<K, unknown>) {
  if (map.size <= MAX_ENTRIES) return;
  const oldestKey = map.keys().next().value;
  if (oldestKey !== undefined) map.delete(oldestKey);
}

/** Called on every heartbeat request — cheap, in-memory only, no DB. */
export function recordHeartbeat(userId: string): void {
  lastSeenMemory.set(userId, Date.now());
  evictIfNeeded(lastSeenMemory);
}

export function isUserOnline(userId: string): boolean {
  const seen = lastSeenMemory.get(userId);
  return seen !== undefined && Date.now() - seen < ONLINE_THRESHOLD_MS;
}

/** The freshest known "last seen" instant for this user — in-memory if we've seen a heartbeat this process lifetime, otherwise whatever's cheaply available (caller supplies the DB fallback). */
function memoryLastSeen(userId: string): number | undefined {
  return lastSeenMemory.get(userId);
}

/**
 * Persists lastSeenAt for this user, throttled to at most once per
 * PERSIST_MIN_INTERVAL_MS — call this after recordHeartbeat, not instead of
 * it. Fire-and-forget from the caller's point of view: failures are logged,
 * never thrown, since a missed persist just means a slightly staler
 * "last seen" for an offline view later, not a broken heartbeat response.
 */
export async function maybePersistLastSeen(userId: string): Promise<void> {
  const now = Date.now();
  const last = lastPersisted.get(userId) ?? 0;
  if (now - last < PERSIST_MIN_INTERVAL_MS) return;

  // Claim the slot before awaiting — concurrent heartbeats for the same user
  // (multiple tabs) shouldn't both win the race and double-write.
  lastPersisted.set(userId, now);
  evictIfNeeded(lastPersisted);

  try {
    await siteDb.user.update({ where: { id: userId }, data: { lastSeenAt: new Date(now) } });
  } catch (err) {
    console.error("[presence] failed to persist lastSeenAt:", err);
  }
}

interface LinkedAccount {
  userId: string;
  lastSeenAt: Date | null;
}

/** Batched minecraftUuid -> {userId, lastSeenAt} lookup, cached briefly — the read-side counterpart of the leaderboard's existing accountLink.findMany badge lookup, reusable so a page of N players costs one query, not N. */
async function resolveLinkedAccountsUncached(uuids: string[]): Promise<Map<string, LinkedAccount>> {
  if (uuids.length === 0) return new Map();

  const links = await siteDb.accountLink.findMany({
    where: { minecraftUuid: { in: uuids }, status: "CONFIRMED" },
    select: { minecraftUuid: true, userId: true, user: { select: { lastSeenAt: true } } },
  });

  return new Map(
    links
      .filter((l): l is typeof l & { minecraftUuid: string } => l.minecraftUuid !== null)
      .map((l) => [l.minecraftUuid, { userId: l.userId, lastSeenAt: l.user.lastSeenAt }])
  );
}

export interface SitePresence {
  online: boolean;
  lastSeenMs: number | null;
}

const NOT_LINKED: SitePresence = { online: false, lastSeenMs: null };

/**
 * Site presence for a batch of Minecraft UUIDs in one call — the shape
 * leaderboard/list rendering needs. Unlinked UUIDs simply don't appear in
 * the returned Map; look up with `.get(uuid) ?? NOT_LINKED_PRESENCE`, or use
 * `resolveSitePresence` for the single-player convenience wrapper below.
 */
export async function resolveSitePresenceBatch(uuids: string[]): Promise<Map<string, SitePresence>> {
  if (uuids.length === 0) return new Map();

  // Cache key is the sorted uuid set — stable regardless of row order, and
  // small (page size, capped at 100) so this never grows into a cache-key
  // explosion the way per-search-term keys elsewhere are capped by TTL/LRU.
  const cacheKey = `presence:links:${[...uuids].sort().join(",")}`;
  const linked = await withCache(cacheKey, ACCOUNT_LINK_TTL_MS, () => resolveLinkedAccountsUncached(uuids));

  const result = new Map<string, SitePresence>();
  for (const uuid of uuids) {
    const account = linked.get(uuid);
    if (!account) continue;

    const memMs = memoryLastSeen(account.userId);
    const dbMs = account.lastSeenAt?.getTime() ?? undefined;
    const lastSeenMs = memMs !== undefined ? Math.max(memMs, dbMs ?? 0) : dbMs ?? null;

    result.set(uuid, {
      online: isUserOnline(account.userId),
      lastSeenMs: lastSeenMs ?? null,
    });
  }
  return result;
}

/** Single-player convenience wrapper around resolveSitePresenceBatch — same cache, one uuid. */
export async function resolveSitePresence(uuid: string): Promise<SitePresence> {
  const map = await resolveSitePresenceBatch([uuid]);
  return map.get(uuid) ?? NOT_LINKED;
}

/**
 * Drops every cached minecraftUuid -> {userId, lastSeenAt} lookup —
 * call this whenever an AccountLink is severed (unlink, admin unlink, user
 * delete). Unlinking is supposed to be a full break between the site
 * account and the Minecraft profile; without this, resolveSitePresenceBatch
 * keeps answering from the pre-unlink snapshot for up to ACCOUNT_LINK_TTL_MS
 * (60s) — long enough to look, to whoever's testing it, like the site never
 * actually severed the link. Not scoped to one uuid: the cache key is the
 * whole *sorted set* of uuids a caller asked about, so there's no way to
 * evict just one entry — clearing everything is cheap (next read just
 * rebuilds it) and correctness here matters more than the minor rebuild cost.
 */
export function invalidatePresenceLinkCache(): void {
  invalidateByPrefix("presence:links:");
}

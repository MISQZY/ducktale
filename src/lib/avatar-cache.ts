import type { PlayerColor } from "@/types/player-card";

/**
 * Cache for the current session's own nav-avatar skin URL and chat-color —
 * an in-memory layer (getCachedAvatar) plus a localStorage-backed one
 * (getCachedAvatarFromStorage).
 *
 * Navbar is part of the (main) route group's persistent layout, so it
 * normally stays mounted across client-side navigations — but a hard
 * reload, or navigating to a route outside that group (docs, not-found),
 * still remounts it from scratch. The in-memory layer alone only helps the
 * latter case: a hard reload re-evaluates the whole JS bundle, so the
 * module-scope `cached` variable is always empty at that point regardless —
 * without localStorage, that remount reset the "cabinet" pill's head icon
 * and color tint to null and re-fetched /api/account/avatar over the
 * network, visibly flashing back to the fallback icon/no tint until it
 * resolved. localStorage survives the reload, so the same correction can
 * happen from a synchronous read instead of waiting on a round trip.
 *
 * getCachedAvatarFromStorage must only ever be called from an effect, never
 * from render (e.g. Navbar's useState initializer) — localStorage isn't
 * available during SSR, so a value read from it during the client's first
 * hydration render would disagree with what the server rendered and React
 * would flag a hydration mismatch (same hazard usePagedTable.ts documents
 * for reading the URL during render). getCachedAvatar (in-memory) stays
 * safe for that render-time use specifically because it's never populated
 * during SSR either, so server and first-client-render always agree it's a
 * miss.
 *
 * Both keyed by userId (not just "the current user") so switching accounts
 * in the same tab/browser can't leak the previous user's head/color.
 *
 * TTL mirrors /api/account/avatar's own `Cache-Control: max-age=60` — after
 * that the values might genuinely be stale (relinked to a different
 * account, SkinRestorer override changed, in-game color changed), so a
 * background refetch is worth it. invalidate() is also called explicitly
 * on unlink/relink so a session that changes its link doesn't have to wait
 * out the TTL to see the new head/color.
 */

const TTL_MS = 60_000;
const STORAGE_KEY = "avatarCache";

interface CachedAvatar {
  userId:    string;
  skinUrl:   string | null;
  nameColor: PlayerColor | null;
  fetchedAt: number;
}

export interface AvatarCacheEntry {
  skinUrl:   string | null;
  nameColor: PlayerColor | null;
}

let cached: CachedAvatar | null = null;

function isFresh(entry: CachedAvatar, userId: string): boolean {
  return entry.userId === userId && Date.now() - entry.fetchedAt <= TTL_MS;
}

function readStorage(): CachedAvatar | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CachedAvatar) : null;
  } catch {
    // Private-mode/disabled storage, or a malformed stored value — treat
    // exactly like "nothing cached", not an error.
    return null;
  }
}

/** In-memory only — safe to call during render, including the client's first hydration render (see the module doc comment above for why). Doesn't survive a hard reload; see getCachedAvatarFromStorage for that case. */
export function getCachedAvatar(userId: string): AvatarCacheEntry | undefined {
  if (!cached || !isFresh(cached, userId)) return undefined;
  return { skinUrl: cached.skinUrl, nameColor: cached.nameColor };
}

/** localStorage-backed — survives a hard reload, but for that exact reason must only be called from an effect, never from render (see the module doc comment above). */
export function getCachedAvatarFromStorage(userId: string): AvatarCacheEntry | undefined {
  const entry = readStorage();
  if (!entry || !isFresh(entry, userId)) return undefined;
  return { skinUrl: entry.skinUrl, nameColor: entry.nameColor };
}

export function setCachedAvatar(userId: string, skinUrl: string | null, nameColor: PlayerColor | null): void {
  cached = { userId, skinUrl, nameColor, fetchedAt: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch { /* private-mode/disabled/quota — in-memory cache still applies for this session */ }
}

/** Call after anything that changes which Minecraft account (if any) this session is linked to — unlink, relink confirmed. */
export function invalidateAvatarCache(): void {
  cached = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch { /* */ }
}

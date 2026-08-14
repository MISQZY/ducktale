/**
 * Module-scoped cache for the current session's own nav-avatar skin URL.
 *
 * Navbar isn't part of the persistent [lang] layout — every page navigation
 * mounts a fresh <Navbar/>, so without this the "cabinet" pill's head icon
 * reset to null and re-fetched /api/account/avatar on *every* navigation,
 * visibly flashing back to the fallback icon before the real skin popped
 * back in. Keyed by userId (not just "the current user") so switching
 * accounts in the same tab can't leak the previous user's head.
 *
 * TTL mirrors /api/account/avatar's own `Cache-Control: max-age=60` — after
 * that the skin might genuinely be stale (relinked to a different account,
 * SkinRestorer override changed), so a background refetch is worth it.
 * invalidate() is also called explicitly on unlink/relink so a session that
 * changes its link doesn't have to wait out the TTL to see the new head.
 */

const TTL_MS = 60_000;

interface CachedAvatar {
  userId: string;
  skinUrl: string | null;
  fetchedAt: number;
}

let cached: CachedAvatar | null = null;

/** Returns the cached skin URL, or `undefined` if there's no fresh entry for this user (never fetched, TTL expired, or a different user). */
export function getCachedAvatar(userId: string): string | null | undefined {
  if (!cached || cached.userId !== userId) return undefined;
  if (Date.now() - cached.fetchedAt > TTL_MS) return undefined;
  return cached.skinUrl;
}

export function setCachedAvatar(userId: string, skinUrl: string | null): void {
  cached = { userId, skinUrl, fetchedAt: Date.now() };
}

/** Call after anything that changes which Minecraft account (if any) this session is linked to — unlink, relink confirmed. */
export function invalidateAvatarCache(): void {
  cached = null;
}

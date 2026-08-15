import type { PlayerColor } from "@/types/player-card";

/**
 * Module-scoped cache for the current session's own nav-avatar skin URL and
 * chat-color.
 *
 * Navbar is part of the (main) route group's persistent layout, so it
 * normally stays mounted across client-side navigations — but a hard
 * reload, or navigating to a route outside that group (docs, not-found),
 * still remounts it from scratch. Without this cache, that remount reset
 * the "cabinet" pill's head icon and color tint to null and re-fetched
 * /api/account/avatar, visibly flashing back to the fallback icon/no tint
 * before the real values popped back in. Keyed by userId (not just "the
 * current user") so switching accounts in the same tab can't leak the
 * previous user's head/color.
 *
 * TTL mirrors /api/account/avatar's own `Cache-Control: max-age=60` — after
 * that the values might genuinely be stale (relinked to a different
 * account, SkinRestorer override changed, in-game color changed), so a
 * background refetch is worth it. invalidate() is also called explicitly
 * on unlink/relink so a session that changes its link doesn't have to wait
 * out the TTL to see the new head/color.
 */

const TTL_MS = 60_000;

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

/** Returns the cached entry, or `undefined` if there's no fresh one for this user (never fetched, TTL expired, or a different user). */
export function getCachedAvatar(userId: string): AvatarCacheEntry | undefined {
  if (!cached || cached.userId !== userId) return undefined;
  if (Date.now() - cached.fetchedAt > TTL_MS) return undefined;
  return { skinUrl: cached.skinUrl, nameColor: cached.nameColor };
}

export function setCachedAvatar(userId: string, skinUrl: string | null, nameColor: PlayerColor | null): void {
  cached = { userId, skinUrl, nameColor, fetchedAt: Date.now() };
}

/** Call after anything that changes which Minecraft account (if any) this session is linked to — unlink, relink confirmed. */
export function invalidateAvatarCache(): void {
  cached = null;
}

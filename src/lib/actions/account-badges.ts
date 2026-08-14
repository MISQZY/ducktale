"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { invalidateByPrefix } from "@/lib/query-cache";

/**
 * Lets the signed-in user choose which of their own badges is shown next to
 * their name on the leaderboard (see /api/leaderboard). `null` clears the
 * pin — the leaderboard then falls back to whichever badge has the earliest
 * UserBadge.awardedAt.
 *
 * "At most one pinned badge" is an app-level rule enforced here, not a DB
 * constraint (UserBadge.pinned is a plain boolean) — clearing any existing
 * pin(s) before setting the new one keeps that true today, but nothing
 * stops this from becoming "pin up to N" later without a schema change.
 */
export async function setPinnedBadge(lang: string, badgeId: string | null): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  if (badgeId !== null) {
    // Only pin a badge this user actually holds — a forged id here would
    // otherwise let anyone "pin" an arbitrary badge id without ever earning it.
    const held = await siteDb.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
      select: { badgeId: true },
    });
    if (!held) throw new Error("You don't hold this badge");
  }

  await siteDb.$transaction([
    siteDb.userBadge.updateMany({ where: { userId, pinned: true }, data: { pinned: false } }),
    ...(badgeId !== null
      ? [siteDb.userBadge.update({ where: { userId_badgeId: { userId, badgeId } }, data: { pinned: true } })]
      : []),
  ]);

  // revalidatePath only busts Next's own page/router cache — /api/leaderboard
  // has its own in-memory TTL cache (src/lib/query-cache.ts) that's
  // otherwise unaffected by it, so a pin change wouldn't show up there for
  // up to LEADERBOARD_TTL_MS without this.
  invalidateByPrefix("leaderboard:");

  revalidatePath(`/${lang}/profile`);
  revalidatePath(`/${lang}/leaderboard`);
}

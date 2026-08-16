import { NextResponse } from "next/server";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyPluginSecret } from "@/lib/plugin-auth";

/**
 * Server-to-server endpoint for the Minecraft side to award a badge from an
 * in-game trigger (e.g. a BetonQuest objective completing), mirroring the
 * upsert pattern already used by the admin-only awardBadge() action
 * (src/lib/actions/admin-badges.ts) — this is just that same idempotent
 * grant, reachable from outside a next-auth session and gated by
 * PLUGIN_API_SECRET (see plugin-auth.ts) instead.
 *
 * Players are identified by the site profile's own uuid (User.id) — badges
 * are a site-profile concept, not an in-game one, so this deliberately does
 * NOT resolve through AccountLink/minecraftUuid the way ticket/thread
 * authorship does. The caller is expected to already know the site userId
 * (e.g. via the account-link flow), not just the Minecraft uuid. Badges by
 * their stable `key` (not the raw uuid `id`), the same reference used
 * everywhere else a badge is looked up outside its own admin CRUD.
 */
export async function POST(req: Request) {
  if (!verifyPluginSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(req, "badges-award", 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, badgeKey } = payload as Record<string, unknown>;
  if (typeof userId !== "string" || !userId.trim()) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (typeof badgeKey !== "string" || !badgeKey.trim()) {
    return NextResponse.json({ error: "badgeKey is required" }, { status: 400 });
  }

  const [user, badge] = await Promise.all([
    siteDb.user.findUnique({ where: { id: userId }, select: { id: true } }),
    siteDb.badge.findUnique({ where: { key: badgeKey }, select: { id: true } }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "Unknown userId" }, { status: 404 });
  }
  if (!badge) {
    return NextResponse.json({ error: "Unknown badge key" }, { status: 404 });
  }

  await siteDb.userBadge.upsert({
    where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
    create: { userId: user.id, badgeId: badge.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

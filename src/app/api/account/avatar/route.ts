import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { resolveSkinUrl } from "@/lib/skin";
import { resolveNameColor } from "@/lib/player-card";
import { isRateLimited } from "@/lib/rate-limit";

/** The signed-in user's own skin head + chat-color, for the nav bar — null if their account isn't linked (or isn't confirmed) yet. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(req, "account-avatar", 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const link = await siteDb.accountLink.findUnique({
    where: { userId: session.user.id },
    select: { status: true, minecraftUuid: true },
  });

  if (link?.status !== "CONFIRMED" || !link.minecraftUuid) {
    return NextResponse.json({ skinUrl: null, nameColor: null });
  }

  const [skinUrl, nameColor] = await Promise.all([
    resolveSkinUrl(link.minecraftUuid),
    resolveNameColor(link.minecraftUuid),
  ]);
  return NextResponse.json(
    { skinUrl, nameColor },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}

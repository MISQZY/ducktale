import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { resolveSkinUrl } from "@/lib/skin";
import { isRateLimited } from "@/lib/rate-limit";

/** The signed-in user's own skin head, for the nav bar — null if their account isn't linked (or isn't confirmed) yet. */
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
    return NextResponse.json({ skinUrl: null });
  }

  const skinUrl = await resolveSkinUrl(link.minecraftUuid);
  return NextResponse.json(
    { skinUrl },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}

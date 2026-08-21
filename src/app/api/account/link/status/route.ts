import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";

/** Polled by LinkAccountFlow every 4s while a link is PENDING. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(req, "account-link-status", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const link = await siteDb.accountLink.findUnique({
    where: { userId: session.user.id },
    select: {
      status: true,
      code: true,
      minecraftName: true,
      minecraftUuid: true,
      expiresAt: true,
    },
  });

  if (!link) {
    return NextResponse.json({ status: "NONE" as const });
  }

  const expired = link.status === "PENDING" && link.expiresAt.getTime() < Date.now();

  return NextResponse.json({
    status: expired ? "EXPIRED" : link.status,
    // Only useful to show while still waiting on confirmation.
    code: link.status === "PENDING" && !expired ? link.code : undefined,
    minecraftName: link.minecraftName,
    minecraftUuid: link.minecraftUuid,
    expiresAt: link.expiresAt,
  });
}

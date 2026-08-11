import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { requestNewLinkCode } from "@/lib/account-link";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(req, "account-link-request", 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const link = await requestNewLinkCode(session.user.id);
  return NextResponse.json({ link });
}

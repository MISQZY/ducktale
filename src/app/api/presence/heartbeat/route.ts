import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { recordHeartbeat, maybePersistLastSeen } from "@/lib/presence";

/**
 * Called every ~60s by the client-side PresenceHeartbeat component while a
 * logged-in user has the site open in a visible tab. recordHeartbeat() is
 * in-memory only (no DB); maybePersistLastSeen() is throttled to at most
 * once per user per 2 minutes, so this route's actual DB cost stays flat
 * regardless of how many tabs/users are pinging it.
 */
export async function POST(req: Request) {
  // Generous cap — this is a low-value, frequent-by-design endpoint, the
  // limit exists only to bound abuse (a scripted flood), not real usage
  // (one legitimate client sends at most 1 request/minute per tab).
  if (isRateLimited(req, "presence-heartbeat", 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  recordHeartbeat(session.user.id);
  await maybePersistLastSeen(session.user.id);

  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { getNotificationsSnapshot } from "@/lib/notifications";

export interface NotificationsResponse {
  items: {
    id: string;
    type: string;
    payload: unknown;
    read: boolean;
    createdAtMs: number;
  }[];
  unreadCount: number;
}

/**
 * Polled by NotificationsContext (src/context/NotificationsContext.tsx),
 * not pushed — see the notification-system complexity write-up this route
 * came out of: polling reuses the exact pattern ServerStatusContext already
 * established for /api/server-status/all, rather than adding a first
 * WebSocket/SSE connection type to the app for this. Always the caller's
 * own notifications (no id/userId param) — the session is the only input
 * that decides what comes back. getNotificationsSnapshot caches the actual
 * DB work for a short TTL (src/lib/notifications.ts) so multiple tabs/rapid
 * polls from the same user share one DB round trip instead of each firing
 * their own.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (isRateLimited(req, "notifications-poll", 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { items: rows, unreadCount } = await getNotificationsSnapshot(session.user.id);

  const result: NotificationsResponse = {
    items: rows.map((r) => ({
      id: r.id,
      type: r.type,
      payload: r.payload,
      read: r.read,
      createdAtMs: r.createdAt.getTime(),
    })),
    unreadCount,
  };

  // No shared HTTP cache (unlike /api/server-status/all) — this response is
  // per-session, not something a CDN/shared cache could ever reuse across
  // different visitors. (getNotificationsSnapshot's own in-memory cache
  // above is per-userId, which is exactly the granularity this needs.)
  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
}

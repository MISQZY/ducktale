import { NextResponse } from "next/server";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";
import { getThreadViewer, hasThreadAccess } from "@/lib/threads";
import { resolveThreadMessages } from "@/lib/thread-data";

/** Polled by ThreadView every few seconds while the tab is visible, to give the reply thread a live-chat feel without standing up a websocket. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getThreadViewer();
  if (!viewer || !hasThreadAccess(viewer)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(req, "thread-poll", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const thread = await siteDb.thread.findUnique({
    where: { id },
    select: { id: true, closed: true },
  });

  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ?since=<ISO timestamp> — see resolveTicketMessages'/[id]/route.ts's
  // matching comment (src/app/api/tickets/[id]/route.ts). Invalid/missing
  // falls back to the full history.
  const sinceParam = new URL(req.url).searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;
  const afterCreatedAt = since && !Number.isNaN(since.getTime()) ? since : undefined;

  const messages = await resolveThreadMessages(id, afterCreatedAt);

  return NextResponse.json({
    closed: thread.closed,
    messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
}

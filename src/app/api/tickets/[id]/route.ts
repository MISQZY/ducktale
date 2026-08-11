import { NextResponse } from "next/server";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";
import { getTicketViewer, canViewTicket } from "@/lib/tickets";

/** Polled by TicketThread every few seconds while the tab is visible, to give the reply thread a live-chat feel without standing up a websocket. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getTicketViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(req, "ticket-poll", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const ticket = await siteDb.ticket.findUnique({
    where: { id },
    select: {
      userId: true,
      status: true,
    },
  });

  // Same response whether the ticket doesn't exist or just isn't this
  // viewer's to see — doesn't confirm a ticket ID exists to someone who
  // isn't allowed to view it.
  if (!ticket || !canViewTicket(viewer, ticket)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await siteDb.ticketMessage.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      isAdminReply: true,
      createdAt: true,
      author: { select: { nickname: true } },
      attachments: {
        select: {
          id: true,
          filename: true,
          size: true,
          mimeType: true,
        }
      }
    },
  });

  return NextResponse.json({
    status: ticket.status,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      isAdminReply: m.isAdminReply,
      createdAt: m.createdAt.toISOString(),
      authorNickname: m.author.nickname,
      attachments: m.attachments,
    })),
  });
}

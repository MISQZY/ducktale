import { siteDb } from "@/lib/site-db";
import { resolveSkinUrlMap } from "@/lib/skin";

export interface TicketAttachmentDTO {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface TicketMessageDTO {
  id: string;
  type: "MESSAGE" | "CLOSED" | "REOPENED";
  body: string;
  isAdminReply: boolean;
  createdAt: Date;
  /** Which side of the thread a message renders on (TicketThread.tsx compares this against the current viewer's own id) — deliberately not staff-vs-owner grouping, so replying-among-multiple-staff still shows each message on whichever side its actual author is looking from. Not anonymized like authorSkinUrl below: it's never displayed, only compared. */
  authorId: string;
  authorNickname: string;
  authorSkinUrl: string | null;
  attachments: TicketAttachmentDTO[];
}

/**
 * Shared by the ticket detail page's initial load and the /api/tickets/[id]
 * poll route — same shape both need, resolved once here instead of twice.
 * Mirrors resolveThreadMessages in @/lib/thread-data (both build on the same
 * resolveSkinUrlMap in @/lib/skin for per-unique-author skin batching, and
 * both query the same underlying Message table — see its doc comment in the
 * schema) — the two resolvers aren't merged into one helper since Ticket
 * messages carry attachments/isAdminReply and Thread ones don't need either,
 * and the two DTO shapes would otherwise need an artificial union just to
 * share a function neither side fully needs.
 *
 * viewerIsStaff (isTicketStaff() in @/lib/tickets — true for isAdmin and any
 * tickets-view/tickets-edit holder) controls the same anonymization
 * TicketThread.tsx applies visually (a non-staff viewer sees a staff reply's
 * author as a generic "Administrator", never the specific staff member) —
 * authorSkinUrl is nulled here for that case too, server-side, so it never
 * reaches a non-staff viewer's client state at all. Leaving it in the
 * payload just because the UI happens not to render it would still let it
 * be read from devtools/network.
 *
 * `afterCreatedAt` narrows to messages newer than that timestamp — the
 * /api/tickets/[id] poll route passes the client's own latest-known message
 * time here once it has one, so a poll only ever fetches (and re-resolves
 * skins for) what's actually new instead of the whole thread every few
 * seconds. Omitted for the ticket page's own initial server-side load,
 * which needs the full history regardless.
 */
export async function resolveTicketMessages(
  ticketId: string,
  viewerIsStaff: boolean,
  afterCreatedAt?: Date
): Promise<TicketMessageDTO[]> {
  const messages = await siteDb.message.findMany({
    where: { ticketId, ...(afterCreatedAt ? { createdAt: { gt: afterCreatedAt } } : {}) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      body: true,
      isAdminReply: true,
      createdAt: true,
      authorId: true,
      author: {
        select: {
          nickname: true,
          accountLink: { select: { status: true, minecraftUuid: true } },
        },
      },
      attachments: {
        select: { id: true, filename: true, size: true, mimeType: true },
      },
    },
  });

  const skinByUuid = await resolveSkinUrlMap(
    messages.map((m) => (m.author.accountLink?.status === "CONFIRMED" ? m.author.accountLink.minecraftUuid : null))
  );

  return messages.map((m) => ({
    id: m.id,
    type: m.type,
    body: m.body,
    isAdminReply: m.isAdminReply,
    createdAt: m.createdAt,
    authorId: m.authorId,
    authorNickname: m.author.nickname,
    authorSkinUrl:
      m.isAdminReply && !viewerIsStaff
        ? null
        : m.author.accountLink?.status === "CONFIRMED" && m.author.accountLink.minecraftUuid
          ? skinByUuid.get(m.author.accountLink.minecraftUuid) ?? null
          : null,
    attachments: m.attachments,
  }));
}

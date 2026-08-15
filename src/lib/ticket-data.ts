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
  body: string;
  isAdminReply: boolean;
  createdAt: Date;
  authorNickname: string;
  authorSkinUrl: string | null;
  attachments: TicketAttachmentDTO[];
}

/**
 * Shared by the ticket detail page's initial load and the /api/tickets/[id]
 * poll route — same shape both need, resolved once here instead of twice.
 * Mirrors resolveThreadMessages in @/lib/thread-data (both build on the same
 * resolveSkinUrlMap in @/lib/skin for per-unique-author skin batching) — the
 * two aren't merged into one helper since Ticket has attachments and Thread
 * doesn't, and the two message shapes would otherwise need an artificial
 * union just to share a function neither side fully needs.
 *
 * viewerIsAdmin controls the same anonymization TicketThread.tsx applies
 * visually (a non-admin viewer sees an admin reply's author as a generic
 * "Administrator", never the specific admin) — authorSkinUrl is nulled here
 * for that case too, server-side, so it never reaches a non-admin viewer's
 * client state at all. Leaving it in the payload just because the UI
 * happens not to render it would still let it be read from devtools/network.
 */
export async function resolveTicketMessages(ticketId: string, viewerIsAdmin: boolean): Promise<TicketMessageDTO[]> {
  const messages = await siteDb.ticketMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      isAdminReply: true,
      createdAt: true,
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
    body: m.body,
    isAdminReply: m.isAdminReply,
    createdAt: m.createdAt,
    authorNickname: m.author.nickname,
    authorSkinUrl:
      m.isAdminReply && !viewerIsAdmin
        ? null
        : m.author.accountLink?.status === "CONFIRMED" && m.author.accountLink.minecraftUuid
          ? skinByUuid.get(m.author.accountLink.minecraftUuid) ?? null
          : null,
    attachments: m.attachments,
  }));
}

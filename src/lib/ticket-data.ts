import { siteDb } from "@/lib/site-db";
import { resolveSkinUrls } from "@/lib/skin";

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
 * Mirrors resolveThreadMessages in @/lib/thread-data (same per-unique-author
 * skin batching via the existing chunked/cached resolveSkinUrls) — the two
 * aren't merged into one helper since Ticket has attachments and Thread
 * doesn't, and the two message shapes would otherwise need an artificial
 * union just to share a function neither side fully needs.
 */
export async function resolveTicketMessages(ticketId: string): Promise<TicketMessageDTO[]> {
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

  const uuids = Array.from(new Set(
    messages
      .map((m) => (m.author.accountLink?.status === "CONFIRMED" ? m.author.accountLink.minecraftUuid : null))
      .filter((u): u is string => !!u)
  ));
  const skinUrls = await resolveSkinUrls(uuids);
  const skinByUuid = new Map(uuids.map((u, i) => [u, skinUrls[i]]));

  return messages.map((m) => ({
    id: m.id,
    body: m.body,
    isAdminReply: m.isAdminReply,
    createdAt: m.createdAt,
    authorNickname: m.author.nickname,
    authorSkinUrl:
      m.author.accountLink?.status === "CONFIRMED" && m.author.accountLink.minecraftUuid
        ? skinByUuid.get(m.author.accountLink.minecraftUuid) ?? null
        : null,
    attachments: m.attachments,
  }));
}

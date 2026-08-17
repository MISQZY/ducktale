import { siteDb } from "@/lib/site-db";
import { resolveSkinUrlMap } from "@/lib/skin";

export interface ReportAttachmentDTO {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ReportMessageDTO {
  id: string;
  body: string;
  isAdminReply: boolean;
  createdAt: Date;
  /** Which side of the thread a message renders on (ReportThread.tsx compares this against the current viewer's own id) — deliberately not staff-vs-reporter grouping, so replying-among-multiple-staff still shows each message on whichever side its actual author is looking from. Not anonymized like authorSkinUrl below: it's never displayed, only compared. */
  authorId: string;
  authorNickname: string;
  authorSkinUrl: string | null;
  attachments: ReportAttachmentDTO[];
}

/**
 * Shared by the report detail page's initial load and the /api/reports/[id]
 * poll route — mirrors resolveTicketMessages in @/lib/ticket-data (same
 * per-unique-author skin batching via resolveSkinUrlMap, same underlying
 * Message table, see that model's doc comment in the schema). Reports have
 * no MessageType event markers (unlike Ticket/Thread — see the Report
 * model's doc comment for why status changes don't get their own timeline
 * row), so this DTO is a bit narrower than TicketMessageDTO.
 *
 * viewerIsStaff (isReportStaff() in @/lib/reports) drives the same
 * anonymization ReportThread.tsx applies visually — a non-staff viewer
 * (the reporter) sees a staff reply's author as a generic "Moderator", never
 * the specific staff member, same reasoning tickets already apply.
 *
 * `afterCreatedAt` narrows to messages newer than that timestamp, same
 * incremental-poll shape resolveTicketMessages uses.
 */
export async function resolveReportMessages(
  reportId: string,
  viewerIsStaff: boolean,
  afterCreatedAt?: Date
): Promise<ReportMessageDTO[]> {
  const messages = await siteDb.message.findMany({
    where: { reportId, ...(afterCreatedAt ? { createdAt: { gt: afterCreatedAt } } : {}) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
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

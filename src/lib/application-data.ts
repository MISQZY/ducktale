import { siteDb } from "@/lib/site-db";
import { resolveSkinUrlMap } from "@/lib/skin";

export interface ApplicationAttachmentDTO {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ApplicationMessageDTO {
  id: string;
  body: string;
  isDeleted: boolean;
  isAdminReply: boolean;
  createdAt: Date;
  /** Which side of the thread a message renders on (ApplicationThread.tsx compares this against the current viewer's own id) — deliberately not staff-vs-applicant grouping, so replying-among-multiple-staff still shows each message on whichever side its actual author is looking from. Not anonymized like authorSkinUrl below: it's never displayed, only compared. */
  authorId: string;
  authorNickname: string;
  authorSkinUrl: string | null;
  attachments: ApplicationAttachmentDTO[];
}

/**
 * Shared by the application detail page's initial load and the
 * /api/applications/[id] poll route — mirrors resolveReportMessages in
 * @/lib/report-data (same per-unique-author skin batching via
 * resolveSkinUrlMap, same underlying Message table, see that model's doc
 * comment in the schema). Applications have no MessageType event markers
 * (same reasoning as Report — see the Application model's doc comment),
 * so this DTO is a bit narrower than TicketMessageDTO.
 *
 * viewerIsStaff (isApplicationStaff() in @/lib/applications) drives the same
 * anonymization ApplicationThread.tsx applies visually — a non-staff viewer
 * (the applicant) sees a staff reply's author as a generic "Moderator", never
 * the specific staff member, same reasoning reports already apply.
 *
 * `afterCreatedAt` narrows to messages newer than that timestamp, same
 * incremental-poll shape resolveReportMessages uses.
 */
export async function resolveApplicationMessages(
  applicationId: string,
  viewerIsStaff: boolean,
  afterCreatedAt?: Date
): Promise<ApplicationMessageDTO[]> {
  const messages = await siteDb.message.findMany({
    where: { applicationId, ...(afterCreatedAt ? { createdAt: { gt: afterCreatedAt } } : {}) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      isDeleted: true,
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
    isDeleted: m.isDeleted,
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

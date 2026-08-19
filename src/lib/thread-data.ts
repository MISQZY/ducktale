import { siteDb } from "@/lib/site-db";
import { resolveSkinUrlMap } from "@/lib/skin";

export interface AttachmentData {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ThreadMessageDTO {
  id: string;
  type: "MESSAGE" | "CLOSED" | "REOPENED" | "STATUS_CHANGED";
  body: string;
  isDeleted: boolean;
  attachments: AttachmentData[];
  createdAt: Date;
  authorId: string;
  authorNickname: string;
  authorSkinUrl: string | null;
}

/**
 * Shared by the thread detail page's initial load and the /api/threads/[id]
 * poll route — both need the exact same message shape, so this is the one
 * place that resolves it instead of each independently reimplementing the
 * skin lookup below.
 *
 * Author skins are resolved once per unique confirmed-linked uuid (not once
 * per message) via resolveSkinUrlMap (@/lib/skin), the same chunked/cached
 * convention used everywhere else a player's head needs to render (navbar,
 * leaderboard, homepage marquee, ...).
 *
 * `afterCreatedAt` narrows to messages newer than that timestamp — see
 * resolveTicketMessages' matching doc comment (src/lib/ticket-data.ts) for
 * why: the /api/threads/[id] poll route passes the client's own
 * latest-known message time here so a poll only fetches what's new.
 */
export async function resolveThreadMessages(threadId: string, afterCreatedAt?: Date): Promise<ThreadMessageDTO[]> {
  const messages = await siteDb.message.findMany({
    where: { threadId, ...(afterCreatedAt ? { createdAt: { gt: afterCreatedAt } } : {}) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      body: true,
        isDeleted: true,
        createdAt: true,
        attachments: { select: { id: true, filename: true, size: true, mimeType: true } },
      authorId: true,
      author: {
        select: {
          nickname: true,
          accountLink: { select: { status: true, minecraftUuid: true } },
        },
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
    isDeleted: m.isDeleted,
      attachments: m.attachments,
    createdAt: m.createdAt,
    authorId: m.authorId,
    authorNickname: m.author.nickname,
    authorSkinUrl:
      m.author.accountLink?.status === "CONFIRMED" && m.author.accountLink.minecraftUuid
        ? skinByUuid.get(m.author.accountLink.minecraftUuid) ?? null
        : null,
  }));
}

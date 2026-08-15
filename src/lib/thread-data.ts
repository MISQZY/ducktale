import { siteDb } from "@/lib/site-db";
import { resolveSkinUrlMap } from "@/lib/skin";

export interface ThreadMessageDTO {
  id: string;
  type: "MESSAGE" | "CLOSED" | "REOPENED";
  body: string;
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
 */
export async function resolveThreadMessages(threadId: string): Promise<ThreadMessageDTO[]> {
  const messages = await siteDb.threadMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      body: true,
      createdAt: true,
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
    createdAt: m.createdAt,
    authorId: m.authorId,
    authorNickname: m.author.nickname,
    authorSkinUrl:
      m.author.accountLink?.status === "CONFIRMED" && m.author.accountLink.minecraftUuid
        ? skinByUuid.get(m.author.accountLink.minecraftUuid) ?? null
        : null,
  }));
}

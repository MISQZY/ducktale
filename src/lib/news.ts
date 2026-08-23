import { siteDb } from "@/lib/site-db";
import type { LocalizedName } from "@/lib/i18n-name";
import type { NewsCategory, NewsPostEntry } from "@/config/news";

/**
 * Every news post, newest-first — used by both /admin/news (listing to
 * edit/delete) and the public /news page. No caching here, same reasoning as
 * resolveServerEvents (src/lib/events.ts): a small enough table that a plain
 * query per request is fine.
 */
export async function resolveNewsPosts(): Promise<NewsPostEntry[]> {
  const rows = await siteDb.newsPost.findMany({
    orderBy: { publishedAt: "desc" },
    select: { id: true, scope: true, serverId: true, category: true, icon: true, title: true, content: true, href: true, publishedAt: true },
  });
  return rows.map((r) => ({
    ...r,
    scope: r.scope as NewsPostEntry["scope"],
    category: r.category as NewsCategory,
    title: r.title as unknown as LocalizedName,
    content: r.content as unknown as LocalizedName,
    publishedAt: Math.floor(r.publishedAt.getTime() / 1000),
  }));
}

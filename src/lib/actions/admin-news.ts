"use server";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { requireResourceRoleId } from "@/lib/admin";
import { SERVERS } from "@/config/servers";
import { NEWS_CATEGORIES } from "@/config/news";
import type { NewsCategory } from "@/config/news";
import { isBadgeIconName } from "@/config/badges";
import type { LocalizedName } from "@/lib/i18n-name";

const TITLE_MAX = 100;
const CONTENT_MAX = 1000;

interface NewsFields {
  scope: "site" | "server";
  serverId: string | null;
  icon: string;
  category: NewsCategory;
  title: LocalizedName;
  content: LocalizedName;
  publishedAt: Date;
  href: string | null;
}

function readNewsFields(formData: FormData): NewsFields {
  const scopeRaw = (formData.get("scope") as string | null)?.trim() ?? "";
  if (scopeRaw !== "site" && scopeRaw !== "server") throw new Error("Unknown scope");
  const scope = scopeRaw;

  // A server-scoped post either names one specific server, or leaves
  // serverId empty for a general "applies to all servers" post — shows up
  // under the /news sidebar's "Сервера → Все" filter but not under any one
  // server's own filter (same "network-wide" convention ServerEvent.serverId
  // already uses).
  const serverIdRaw = (formData.get("serverId") as string | null)?.trim() ?? "";
  let serverId: string | null = null;
  if (scope === "server" && serverIdRaw) {
    if (!SERVERS.some((s) => s.id === serverIdRaw)) throw new Error("Unknown server");
    serverId = serverIdRaw;
  }

  const icon = (formData.get("icon") as string | null)?.trim() ?? "";
  if (!icon || !isBadgeIconName(icon)) throw new Error("Unknown icon");

  const category = (formData.get("category") as string | null)?.trim() ?? "";
  if (!NEWS_CATEGORIES.includes(category as NewsCategory)) throw new Error("Unknown category");

  const titleRu = (formData.get("titleRu") as string | null)?.trim().slice(0, TITLE_MAX) ?? "";
  if (!titleRu) throw new Error("Russian title is required");
  const titleEn = (formData.get("titleEn") as string | null)?.trim().slice(0, TITLE_MAX) ?? "";
  if (!titleEn) throw new Error("English title is required");

  const contentRu = (formData.get("contentRu") as string | null)?.trim().slice(0, CONTENT_MAX) ?? "";
  if (!contentRu) throw new Error("Russian content is required");
  const contentEn = (formData.get("contentEn") as string | null)?.trim().slice(0, CONTENT_MAX) ?? "";
  if (!contentEn) throw new Error("English content is required");

  const publishedAtRaw = (formData.get("publishedAt") as string | null) ?? "";
  const publishedAt = new Date(publishedAtRaw);
  if (Number.isNaN(publishedAt.getTime())) throw new Error("Published date is required");

  const hrefRaw = (formData.get("href") as string | null)?.trim() ?? "";
  if (hrefRaw && !/^https?:\/\//i.test(hrefRaw)) throw new Error("Link must start with http:// or https://");

  return {
    scope,
    serverId,
    icon,
    category: category as NewsCategory,
    title: { ru: titleRu, en: titleEn },
    content: { ru: contentRu, en: contentEn },
    publishedAt,
    href: hrefRaw || null,
  };
}

export async function createNewsPost(lang: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("news-edit");
  const fields = readNewsFields(formData);

  await siteDb.newsPost.create({ data: fields });

  revalidatePath(`/${lang}/admin/news`);
  revalidatePath(`/${lang}/news`);
}

export async function updateNewsPost(lang: string, newsId: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("news-edit");
  const fields = readNewsFields(formData);

  await siteDb.newsPost.update({ where: { id: newsId }, data: fields });

  revalidatePath(`/${lang}/admin/news`);
  revalidatePath(`/${lang}/news`);
}

export async function deleteNewsPost(lang: string, newsId: string): Promise<void> {
  await requireResourceRoleId("news-delete");

  await siteDb.newsPost.delete({ where: { id: newsId } });

  revalidatePath(`/${lang}/admin/news`);
  revalidatePath(`/${lang}/news`);
}

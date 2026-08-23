import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { requirePublicResourceRole } from "@/lib/public-access";
import { resolveNewsPosts } from "@/lib/news";
import { NewsFeed } from "@/components/news/NewsFeed";

/**
 * Full-width, fixed-height shell — same shape as /threads and /maps
 * (ResizablePanelGroup filling a h-dvh main) rather than a centered
 * max-width column: the sidebar is a real left panel the page grows into,
 * not a block stacked above the feed inside a narrow column.
 */
export default async function NewsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  await requirePublicResourceRole(lang, "news-page-view");

  const posts = await resolveNewsPosts();

  return (
    <main className="relative overflow-hidden h-dvh flex flex-col px-6 pt-24 pb-8">
      <div className="relative z-10 w-full flex-1 min-h-0">
        <NewsFeed posts={posts} />
      </div>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("News");
  return { title: t("title") };
}

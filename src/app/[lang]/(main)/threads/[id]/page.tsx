import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getThreadViewer, isThreadModerator, isThreadDeleter } from "@/lib/threads";
import { siteDb } from "@/lib/site-db";
import { ThreadView } from "@/components/threads/ThreadView";
import { Link } from "@/i18n/navigation";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { CompactBadgeChip } from "@/components/badges/CompactBadgeChip";

import { resolveSkinUrl } from "@/lib/skin";
import { resolveThreadMessages } from "@/lib/thread-data";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import type { Metadata } from "next";

// A separate, minimal query rather than sharing the page component's full
// thread fetch below — this only ever needs the title column, not worth a
// cache()-shared fetch like profile/[username]/page.tsx's (that one avoids
// duplicating a much heavier query).
import { cache } from "react";

const getThread = cache(async (id: string) => {
  return await siteDb.thread.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: { select: { isClosed: true } },
      authorId: true,
      author: {
        select: {
          nickname: true,
          accountLink: {
            select: { status: true, minecraftName: true, minecraftUuid: true },
          },
          badges: {
            select: {
              badge: {
                select: { id: true, name: true, icon: true, color: true, description: true, earnCondition: true },
              },
            },
            where: { pinned: true },
            take: 1,
          },
        },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const thread = await getThread(id);
  return thread ? { title: thread.title } : {};
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  // Already redirected to login by the parent layout if unauthenticated —
  // this call is just to read viewerId/roles, React's cache() on auth()
  // means it's not a second DB round-trip.
  const viewer = await getThreadViewer();
  if (!viewer) notFound();

  // resolveThreadMessages only depends on the route id, not on the thread
  // record below, so it runs alongside the thread query instead of after it
  // — an avoidable serial DB round trip otherwise.
  const [thread, messages] = await Promise.all([
    getThread(id),
    resolveThreadMessages(id),
  ]);

  if (!thread) notFound();

  // Every viewer sees who started the thread (unlike tickets, there's no
  // owner-only/admin-only split here) — only skip the extra getPlayerCard
  // fetch when the author has no confirmed Minecraft link to look up. Stays
  // serial (after the Promise.all above) since it depends on thread.author.
  let authorSkinUrl = null;
  if (thread.author.accountLink?.status === "CONFIRMED" && thread.author.accountLink.minecraftUuid) {
    authorSkinUrl = await resolveSkinUrl(thread.author.accountLink.minecraftUuid);
  }

  const t = await getTranslations("Threads");

  return (
    <div className="w-full h-full flex flex-col min-w-0">
      <Link href="/threads" className="text-xs text-foreground/45 hover:text-foreground/70 transition-colors mb-4 inline-block shrink-0 lg:hidden">
        {t("backToList")}
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-1 shrink-0">
        <h1 className="text-2xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
          {thread.title}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground/45">{t("initiatorLabel")}</span>
          {thread.author.accountLink?.status === "CONFIRMED" ? (
            <PlayerAvatar
              name={thread.author.nickname}
              skinUrl={authorSkinUrl}
              hasSiteProfile={true}
              linked={true}
              appendNode={
                thread.author.badges.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {thread.author.badges.slice(0, 3).map((b) => (
                      <CompactBadgeChip
                        key={b.badge.id}
                        name={localizedName(b.badge.name as unknown as LocalizedName, lang)}
                        icon={b.badge.icon}
                        color={b.badge.color}
                        description={b.badge.description}
                        earnCondition={b.badge.earnCondition}
                        size={15}
                      />
                    ))}
                    {thread.author.badges.length > 3 && (
                      <span
                        className="text-[0.65rem] text-foreground/40 shrink-0"
                        title={thread.author.badges.slice(3).map((b) => localizedName(b.badge.name as unknown as LocalizedName, lang)).join(", ")}
                      >
                        +{thread.author.badges.length - 3}
                      </span>
                    )}
                  </div>
                ) : null
              }
            />
          ) : (
            <Link
              href={`/profile/${encodeURIComponent(thread.author.nickname)}`}
              target="_blank"
              className="text-foreground/80 font-medium hover:text-primary hover:underline underline-offset-4 transition-colors text-sm"
            >
              {thread.author.nickname}
            </Link>
          )}
        </div>
      </div>

      {thread.description && (
        <p className="text-foreground/60 text-sm mb-4 shrink-0">{thread.description}</p>
      )}
      {!thread.description && <div className="mb-3" />}

      <div className="flex-1 flex flex-col min-h-0">
        <ThreadView
          lang={lang}
          threadId={thread.id}
          title={thread.title}
          backHref="/threads"
          initialClosed={thread.status?.isClosed ?? false}
          initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
          viewerId={viewer.id}
          isAuthor={viewer.id === thread.authorId}
          isModerator={isThreadModerator(viewer)}
          isDeleter={isThreadDeleter(viewer)}
        />
      </div>
    </div>
  );
}

// fix hmr
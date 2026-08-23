"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoldDivider } from "@/components/common/GoldDivider";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { NewsSidebar, type NewsFilterKey } from "@/components/news/NewsSidebar";
import { SERVERS } from "@/config/servers";
import { NEWS_CATEGORY_STYLE } from "@/config/news";
import type { NewsPostEntry } from "@/config/news";
import { localizedName } from "@/lib/i18n-name";

export interface NewsFeedProps {
  posts: NewsPostEntry[];
}

function dateLocale(locale: string): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}

function matchesFilter(post: NewsPostEntry, filter: NewsFilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "site") return post.scope === "site";
  if (filter === "server") return post.scope === "server";
  // A specific server's filter also shows general "all servers" posts
  // (serverId=null) alongside that server's own — a general post is relevant
  // to every server, not just visible in the aggregate "Все" view.
  return post.scope === "server" && (post.serverId === filter || post.serverId === null);
}

function dayKey(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function resolveServerTag(serverId: string | null): { name: string; emoji: string } | null {
  if (!serverId) return null;
  const server = SERVERS.find((s) => s.id === serverId);
  return server ? { name: server.name, emoji: server.emoji } : null;
}

function NewsCard({ post }: { post: NewsPostEntry }) {
  const t = useTranslations("News");
  const locale = useLocale();
  const style = NEWS_CATEGORY_STYLE[post.category];
  // A general server-wide post (scope="server", serverId=null) still gets a
  // tag — 🌐 "Все серверы" — rather than resolving to no tag at all, unlike
  // resolveServerTag(null) for a site-scoped post (which has no server angle
  // to call out in the first place).
  const serverTag = post.scope === "server"
    ? (post.serverId ? resolveServerTag(post.serverId) : { name: t("general"), emoji: "🌐" })
    : null;

  return (
    <div className="liquid-card relative flex gap-4 rounded-xl border border-primary/20 bg-card/45 p-4">
      <span
        className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-card"
        style={{ borderColor: style.accent, color: style.accent }}
        aria-hidden="true"
      >
        <BadgeIcon name={post.icon} size={17} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-semibold text-foreground/90 leading-5" style={{ fontFamily: "var(--font-body)" }}>
            {localizedName(post.title, locale)}
          </p>
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", style.badgeBg, style.badgeBorder, style.badgeText)}>
            {t(`categories.${post.category}`)}
          </span>
          {serverTag && (
            <span
              title={serverTag.name}
              className="inline-flex items-center gap-1 rounded-full border border-primary/15 px-1.5 py-0.5 text-[10px] font-normal text-foreground/40"
            >
              <span aria-hidden="true">{serverTag.emoji}</span>
              {serverTag.name}
            </span>
          )}
        </div>
        <p className="whitespace-pre-line text-xs leading-relaxed text-foreground/60">
          {localizedName(post.content, locale)}
        </p>
        {post.href && (
          <a
            href={post.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
          >
            {t("readMore")}
            <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

export function NewsFeed({ posts }: NewsFeedProps) {
  const t = useTranslations("News");
  const locale = useLocale();
  const [filter, setFilter] = useState<NewsFilterKey>("all");

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: posts.length, site: 0, server: 0, general: 0 };
    for (const post of posts) {
      if (post.scope === "site") result.site += 1;
      else {
        result.server += 1;
        if (post.serverId) result[post.serverId] = (result[post.serverId] ?? 0) + 1;
        else result.general += 1;
      }
    }
    // Each specific server's badge count matches what matchesFilter actually
    // shows for it — that server's own posts plus every general post.
    for (const server of SERVERS) {
      result[server.id] = (result[server.id] ?? 0) + result.general;
    }
    return result;
  }, [posts]);

  const filtered = useMemo(() => posts.filter((post) => matchesFilter(post, filter)), [posts, filter]);

  const groups = useMemo(() => {
    const byDay = new Map<string, { publishedAt: number; posts: NewsPostEntry[] }>();
    for (const post of filtered) {
      const key = dayKey(post.publishedAt);
      const existing = byDay.get(key);
      if (existing) existing.posts.push(post);
      else byDay.set(key, { publishedAt: post.publishedAt, posts: [post] });
    }
    return [...byDay.values()];
  }, [filtered]);

  const formatDay = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "long", year: "numeric" });
    return (unixSeconds: number) => fmt.format(new Date(unixSeconds * 1000));
  }, [locale]);

  return (
    <ResizablePanelGroup id="news-layout" orientation="horizontal" className="h-full w-full">
      <ResizablePanel id="news-sidebar" defaultSize="18" minSize="14" maxSize="30">
        <NewsSidebar active={filter} onChange={setFilter} counts={counts} />
      </ResizablePanel>

      <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

      <ResizablePanel id="news-content" defaultSize="82" minSize="50">
        <div className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4 sm:p-6">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-8 pr-1">
            {groups.length === 0 ? (
              <div className="text-center py-16">
                <GoldDivider wide className="mb-5" />
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-foreground/50">
                  {filter === "all" ? t("empty.all") : t("empty.filtered")}
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.publishedAt}>
                  <p className="mb-3 font-mono text-xs uppercase tracking-widest text-foreground/40">
                    {formatDay(group.publishedAt)}
                  </p>
                  <div className="flex flex-col gap-3">
                    {group.posts.map((post) => (
                      <NewsCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

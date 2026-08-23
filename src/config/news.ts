import type { LocalizedName } from "@/lib/i18n-name";

export type NewsCategory = "feature" | "improvement" | "fix" | "announcement";

export const NEWS_CATEGORIES: NewsCategory[] = ["feature", "improvement", "fix", "announcement"];

export interface NewsCategoryStyle {
  accent: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

/** Visual style per news category — same shape/convention as EVENT_CATEGORY_STYLE (src/config/events.ts). */
export const NEWS_CATEGORY_STYLE: Record<NewsCategory, NewsCategoryStyle> = {
  feature: {
    accent: "#34d399",
    badgeBg: "bg-emerald-500/15 dark:bg-emerald-950/40",
    badgeBorder: "border-emerald-500/30 dark:border-emerald-600/30",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  improvement: {
    accent: "#38bdf8",
    badgeBg: "bg-sky-500/15 dark:bg-sky-950/40",
    badgeBorder: "border-sky-500/30 dark:border-sky-600/30",
    badgeText: "text-sky-700 dark:text-sky-300",
  },
  fix: {
    accent: "#f472b6",
    badgeBg: "bg-pink-500/15 dark:bg-pink-950/40",
    badgeBorder: "border-pink-500/30 dark:border-pink-600/30",
    badgeText: "text-pink-700 dark:text-pink-300",
  },
  announcement: {
    accent: "var(--color-accent-gold)",
    badgeBg: "bg-amber-500/15 dark:bg-primary/40",
    badgeBorder: "border-amber-600/30 dark:border-amber-600/30",
    badgeText: "text-amber-800 dark:text-primary",
  },
};

/**
 * Admin-managed (NewsPost, site DB, /admin/news, src/lib/actions/admin-news.ts)
 * — the public /news page fetches this shape server-side (resolveNewsPosts(),
 * src/lib/news.ts) and passes it to NewsFeed.tsx as a prop. See NewsPost's
 * doc comment in schema.prisma.template for why `scope` exists alongside
 * `serverId` instead of just reusing ServerEvent's nullable-serverId
 * convention.
 */
export interface NewsPostEntry {
  id: string;
  scope: "site" | "server";
  /** null when scope = "site". When scope = "server", either a SERVERS[].id (a specific server) or null (a general "all servers" post — see NewsPost's doc comment in schema.prisma.template). */
  serverId: string | null;
  category: NewsCategory;
  /** lucide-react icon name, or a `Gi*` name from react-icons/gi — same catalog Badge.icon uses (isBadgeIconName, src/config/badges.ts), rendered via <BadgeIcon>. */
  icon: string;
  title: LocalizedName;
  content: LocalizedName;
  /** Optional link to a Discord announcement or doc page. */
  href: string | null;
  /** Unix seconds */
  publishedAt: number;
}

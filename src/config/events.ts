import type { LocalizedName } from "@/lib/i18n-name";

export type EventCategory = "pvp" | "world" | "pve" | "economy";

export const EVENT_CATEGORIES: EventCategory[] = ["pvp", "world", "pve", "economy"];

export interface EventCategoryStyle {
  accent: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  liveDot: string;
}

/**
 * Visual style per event category. Previously declared locally inside
 * EventTimeLine.tsx as CATEGORY_STYLE — moved here so the category's data
 * shape (type) and its presentation (style) live together, matching the
 * convention already used for SERVERS and DIAGRAM_COLOR.
 */
export const EVENT_CATEGORY_STYLE: Record<EventCategory, EventCategoryStyle> = {
  pvp: {
    accent: "#f472b6",
    badgeBg: "bg-pink-500/15 dark:bg-pink-950/40",
    badgeBorder: "border-pink-500/30 dark:border-pink-600/30",
    badgeText: "text-pink-700 dark:text-pink-300",
    liveDot: "bg-pink-500 dark:bg-pink-400",
  },
  world: {
    accent: "#34d399",
    badgeBg: "bg-emerald-500/15 dark:bg-emerald-950/40",
    badgeBorder: "border-emerald-500/30 dark:border-emerald-600/30",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    liveDot: "bg-emerald-500 dark:bg-emerald-400",
  },
  pve: {
    accent: "#a78bfa",
    badgeBg: "bg-violet-500/15 dark:bg-violet-950/40",
    badgeBorder: "border-violet-500/30 dark:border-violet-600/30",
    badgeText: "text-violet-700 dark:text-violet-300",
    liveDot: "bg-violet-500 dark:bg-violet-400",
  },
  economy: {
    accent: "var(--color-accent-gold)",
    badgeBg: "bg-amber-500/15 dark:bg-primary/40",
    badgeBorder: "border-amber-600/30 dark:border-amber-600/30",
    badgeText: "text-amber-800 dark:text-primary",
    liveDot: "bg-amber-600 dark:bg-primary",
  },
};

/**
 * Admin-managed now (ServerEvent, site DB, /admin/events,
 * src/lib/actions/admin-events.ts) — this used to also hold the structural
 * data (UPCOMING_EVENTS) with name/description resolved from
 * i18n/messages/{locale}.json under Events.items.<id>. An admin-created
 * event has no i18n key to hang text off of, so name/description moved onto
 * the row itself (LocalizedName) — see the ServerEvent model's doc comment
 * in schema.prisma.template. The public /events page fetches this shape
 * server-side (resolveServerEvents(), src/lib/events.ts) and passes it to
 * EventTimeline.tsx as a prop.
 */
export interface ServerEvent {
  id: string;
  /** null = network-wide event, not tied to one server. Otherwise matches SERVERS[].id. */
  serverId: string | null;
  /** lucide-react icon name, or a `Gi*` name from react-icons/gi — same catalog Badge.icon uses (isBadgeIconName, src/config/badges.ts), rendered via <BadgeIcon>. */
  icon: string;
  category: EventCategory;
  name: LocalizedName;
  description: LocalizedName;
  /** Unix seconds — event start */
  startAt: number;
  /** Unix seconds — event end */
  endAt: number;
  /** Optional link to Discord announcement or doc page */
  href: string | null;
}

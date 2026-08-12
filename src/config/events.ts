export type EventCategory = "pvp" | "world" | "pve" | "economy";

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

export interface ServerEvent {
  id: string;
  emoji: string;
  category: EventCategory;
  /** Unix seconds — event start */
  startAt: number;
  /** Unix seconds — event end */
  endAt: number;
  /** Optional link to Discord announcement or doc page */
  href?: string;
}

/**
 * Structural data only — name/description are localized and live in
 * src/i18n/messages/{locale}.json under Events.items.<id>, keyed by `id`.
 */
export const UPCOMING_EVENTS: ServerEvent[] = [
  {
    id: "invite-system",
    emoji: "👥",
    category: "world",
    startAt: 1767250800,
    endAt: 1790838000,
    href: "",
  },
  {
    id: "nether-world-open",
    emoji: "🌑",
    category: "world",
    startAt: 1718002800,
    endAt: 1718002800,
    href: "",
  },
  {
    id: "end-world-open",
    emoji: "🌕",
    category: "world",
    startAt: 1718002800,
    endAt: 1718002800,
    href: "",
  },
];

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
    badgeBg: "bg-pink-950/40",
    badgeBorder: "border-pink-600/30",
    badgeText: "text-pink-300",
    liveDot: "bg-pink-400",
  },
  world: {
    accent: "#34d399",
    badgeBg: "bg-emerald-950/40",
    badgeBorder: "border-emerald-600/30",
    badgeText: "text-emerald-300",
    liveDot: "bg-emerald-400",
  },
  pve: {
    accent: "#a78bfa",
    badgeBg: "bg-violet-950/40",
    badgeBorder: "border-violet-600/30",
    badgeText: "text-violet-300",
    liveDot: "bg-violet-400",
  },
  economy: {
    accent: "var(--color-accent-gold)",
    badgeBg: "bg-primary/40",
    badgeBorder: "border-amber-600/30",
    badgeText: "text-foreground",
    liveDot: "bg-primary",
  },
};

export interface ServerEvent {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: EventCategory;
  categoryLabel: string;
  /** Unix seconds — event start */
  startAt: number;
  /** Unix seconds — event end */
  endAt: number;
  /** Optional link to Discord announcement or doc page */
  href?: string;
}

export const UPCOMING_EVENTS: ServerEvent[] = [
    {
    id: "invite-system",
    emoji: "👥",
    name: "Проход на сервер",
    description:
      "Попади в мир DuckBurg, путешествуй, исследуй, развивайся. Не забудь пригласить друзей поиграть вместе с тобой!",
    category: "world",
    categoryLabel: "Мировые",
    startAt: 1767250800,
    endAt: 1790838000,
    href: "",
  },
  {
    id: "nether-world-open",
    emoji: "🌑",
    name: "Открытие Незер мира",
    description:
      "Открытие порталов в мир Незера откроет перед игроками больше возможностей в развитии на просторах мира DuckBurg.",
    category: "world",
    categoryLabel: "Мировые",
    startAt: 1718002800,
    endAt: 1718002800,
    href: "",
  },
  {
    id: "end-world-open",
    emoji: "🌕",
    name: "Открытие мира Края",
    description:
      "Открытие порталов в мир Края откроет перед игроками возможность сразиться с Черным Драконом и доказать, что летать тоже нужно уметь.",
    category: "world",
    categoryLabel: "Мировые",
    startAt: 1718002800,
    endAt: 1718002800,
    href: "",
  },
];

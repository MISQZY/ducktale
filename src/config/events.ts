export type EventCategory = "pvp" | "world" | "pve" | "economy";

export interface ServerEvent {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: EventCategory;
  categoryLabel: string;
  /** Unix ms — event start */
  startAt: number;
  /** Unix ms — event end */
  endAt: number;
  /** Optional link to Discord announcement or doc page */
  href?: string;
}

const now = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const UPCOMING_EVENTS: ServerEvent[] = [
    {
    id: "invite-system",
    emoji: "👥",
    name: "Проход на сервер",
    description:
      "Попади в мир DcukBurg, путешествуй, иследуй, развивайся. Не забудь пригласить друзей поиграть вместе с тобой!",
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
      "Открытие порталов в мир Края откроет перед игроками возможсноть сразиться с Черным Драконом и доказать, что летать тоже нужно уметь.",
    category: "world",
    categoryLabel: "Мировые",
    startAt: 1718002800,
    endAt: 1718002800,
    href: "",
  },
];

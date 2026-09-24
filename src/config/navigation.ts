export type NavKey = "about" | "leaderboard" | "threads" | "maps" | "events" | "news" | "whitelist" | "profile";

export interface NavLeaf {
  type: "link";
  href: string;
  key: NavKey;
}

export interface NavGroup {
  type: "group";
  /** Key into the `Nav` message namespace, for the group's own trigger label. */
  key: "community" | "servers";
  children: NavLeaf[];
}

export type NavItem = NavLeaf | NavGroup;

/**
 * Flat pills grew too wide once enough pages joined (maps, events, and now
 * news) — same problem AdminNav.tsx hit in the admin panel, solved the same
 * way here: related pages fold into a dropdown group instead of each staying
 * its own top-level pill. `about`/`news`/`profile` stay flat — `about` is a
 * same-page anchor (cheap), `news` is the one page meant to stay one click
 * away, `profile` is rendered separately by Navbar as the account pill,
 * never through this list. `whitelist` moved into the `servers` group
 * alongside `maps` — both are per-server-network pages, not `community`.
 */
export const NAV_ITEMS: NavItem[] = [
  { type: "link", href: "/#about", key: "about" },
  { type: "link", href: "/news", key: "news" },
  {
    type: "group",
    key: "community",
    children: [
      { type: "link", href: "/leaderboard", key: "leaderboard" },
      { type: "link", href: "/threads", key: "threads" },
      { type: "link", href: "/events", key: "events" },
    ],
  },
  {
    type: "group",
    key: "servers",
    children: [
      { type: "link", href: "/maps", key: "maps" },
      { type: "link", href: "/whitelist", key: "whitelist" },
    ],
  },
  { type: "link", href: "/profile", key: "profile" },
];

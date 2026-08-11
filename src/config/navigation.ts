export interface NavLink {
  href: string;
  /** Key into the `Nav` message namespace. */
  key: "about" | "servers" | "infrastructure" | "community" | "leaderboard" | "account";
}

export const NAV_LINKS: NavLink[] = [
  { href: "/#about",          key: "about" },
  { href: "/#servers",        key: "servers" },
  { href: "/#infrastructure", key: "infrastructure" },
  { href: "/#community",      key: "community" },
  { href: "/leaderboard",     key: "leaderboard" },
  { href: "/account",         key: "account" },
];

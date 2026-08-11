export interface NavLink {
  href: string;
  /** Key into the `Nav` message namespace. */
  key: "about" | "leaderboard" | "account";
}

export const NAV_LINKS: NavLink[] = [
  { href: "/#about",      key: "about" },
  { href: "/leaderboard", key: "leaderboard" },
  { href: "/account",     key: "account" },
];

export interface NavLink {
  href: string;
  /** Key into the `Nav` message namespace. */
  key: "about" | "leaderboard" | "threads" | "maps" | "profile";
}

export const NAV_LINKS: NavLink[] = [
  { href: "/#about",      key: "about" },
  { href: "/leaderboard", key: "leaderboard" },
  { href: "/threads",     key: "threads" },
  { href: "/maps",        key: "maps" },
  { href: "/profile",     key: "profile" },
];

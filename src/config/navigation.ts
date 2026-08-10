export interface NavLink {
  href: string;
  /** Key into the `Nav` message namespace. */
  key: "about" | "servers" | "infrastructure" | "community";
}

export const NAV_LINKS: NavLink[] = [
  { href: "/#about",          key: "about" },
  { href: "/#servers",        key: "servers" },
  { href: "/#infrastructure", key: "infrastructure" },
  { href: "/#community",      key: "community" },
];

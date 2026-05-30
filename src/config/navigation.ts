export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/#about",          label: "О проекте" },
  { href: "/#servers",        label: "Серверы" },
  { href: "/#infrastructure", label: "Инфраструктура" },
  { href: "/#community",      label: "Сообщество" },
];

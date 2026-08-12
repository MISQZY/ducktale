import { Sword, Paintbrush } from "lucide-react";

export interface ServerConfig {
  id: string;
  uuid: string;
  host: string;
  name: string;
  tagline: string;
  description: string;
  icon: typeof Sword;
  emoji: string;
  color: string;
  border: string;
  badge: string;
  glow: string;
  href: string;
  features: string[];
  docs: {
    sidebarBorderColor: string;
    sidebarBgColor: string;
    sidebarTextColor: string;
  };
}

export const SERVERS: ServerConfig[] = [
  {
    id: "duckburg",
    uuid: "70ffd283-2f55-45d8-a1d0-3381ccf1af8a",
    host: "s6.yufu.su:25582",
    name: "DuckBurg",
    tagline: "Выживание",
    description:
      "Классическое выживание с уникальной экономикой, кланами, аукционом и сотнями часов контента.",
    icon: Sword,
    emoji: "⚔️",
    color: "from-emerald-900/40 to-emerald-800/20",
    border: "border-emerald-700/30 hover:border-emerald-500/60",
    badge: "bg-emerald-900/50 text-emerald-300",
    glow: "hover:shadow-emerald-900/30",
    href: "/docs/duckburg",
    features: ["Экономика", "Города", "Без вайпов", "PvE", "Квесты"],
    docs: {
      sidebarBorderColor: "border-emerald-700/30",
      sidebarBgColor: "bg-emerald-950/30",
      sidebarTextColor: "text-emerald-400",
    },
  },
  {
    id: "duckhood",
    uuid: "55d2555c-3269-4bf5-ada6-eba44c1ff6e8",
    host: "s6.yufu.su:25572",
    name: "DuckHood",
    tagline: "Креатив",
    description:
      "Безграничное пространство для ваших идей. Личные участки, общий мир, конкурсы строений.",
    icon: Paintbrush,
    emoji: "🎨",
    color: "from-sky-900/40 to-indigo-900/20",
    border: "border-sky-700/30 hover:border-sky-400/60",
    badge: "bg-sky-900/50 text-sky-300",
    glow: "hover:shadow-sky-900/30",
    href: "/docs/duckhood",
    features: ["Личные участки", "WorldEdit", "PvE"],
    docs: {
      sidebarBorderColor: "border-sky-700/30",
      sidebarBgColor: "bg-sky-950/30",
      sidebarTextColor: "text-sky-400",
    },
  },
];

/** Minimal per-server display data needed for the player profile's status cards. */
export interface NetworkServer {
  id:     string;
  uuid:   string;
  name:   string;
  emoji:  string;
  color:  string;
  border: string;
}

/**
 * Every server in the network, including technical/infra ones — unlike
 * SERVERS, this is not for public display: it's only iterated by the
 * player-card API and the account dashboard's per-server status cards, not
 * the homepage server list or docs (which use SERVERS directly).
 */
export const NETWORK_SERVERS: NetworkServer[] = [
  ...SERVERS.map(({ id, uuid, name, emoji, color, border }): NetworkServer => ({ id, uuid, name, emoji, color, border })),
  {
    id: "hub",
    uuid: "ea14f5e3-f0c3-4c5d-bc4c-523fd2d1b887",
    name: "Hub",
    emoji: "🌐",
    color: "from-slate-800/40 to-slate-700/20",
    border: "border-slate-600/30 hover:border-slate-500/60",
  },
];

export const NETWORK_HOST = "mc.ducktale.online";
export const NETWORK_BEDROCK_PORT = 25567;

/** Hidden destination the animated duck easter egg (DuckyPet) links to. */
export const DUCKY_EASTER_EGG_HOST = "duckeldor.ducktale.online";
import { Sword, Paintbrush } from "lucide-react";

export interface ServerConfig {
  id: string;
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
}

export const SERVERS: ServerConfig[] = [
  {
    id: "duckburg",
    host: "s6.yufu.su:25582",
    name: "DuckBurg",
    tagline: "Выживание",
    description:
      "Классическое выживание с уникальной экономикой, кланами, аукционом и сотнями часов контента.",
    icon: Sword,
    emoji: "⚔️",
    color: "from-green-900/40 to-emerald-900/20",
    border: "border-green-700/30 hover:border-green-500/60",
    badge: "bg-green-900/50 text-green-300",
    glow: "hover:shadow-green-900/30",
    href: "/docs/duckburg",
    features: ["Экономика", "Города", "Без вайпов", "PvE", "Квесты"],
  },
  {
    id: "duckhood",
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
  },
];

export const NETWORK_HOST = "s6.yufu.su:25569";
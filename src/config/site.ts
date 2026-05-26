export const SITE = {
  name: "DuckTale",
  tagline: "Сеть серверов",
  description: "DuckTale — сеть Minecraft серверов с выживанием и творческим режимом",
  foundedYear: 2024,
  legalNotice: "Не является официальным сервисом Minecraft. Не одобрено и не связано с компанией Mojang, Microsoft.",
} as const;

export const STATS = [
  { n: "2+", label: "года работы проекта" },
  { n: "1000+", label: "человек посетило проект" },
] as const;

export const FEATURES = [
  {
    title: "Защита и стабильность",
    desc: "Выделенные серверы с защитой от DDoS, ежедневные бэкапы, аптайм 99.9%.",
  },
  {
    title: "Живое сообщество",
    desc: "Дружный Discord, регулярные ивенты, активные администраторы всегда на связи.",
  },
] as const;

export interface SocialLink {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  color: {
    icon: string;
    border: string;
    bg: string;
    glow: string;
  };
}

export const SOCIALS: SocialLink[] = [
  {
    id: "discord",
    label: "Discord",
    sublabel: "Основное сообщество",
    href: "https://discord.gg/3fNYeBRueE",
    color: {
      icon: "text-indigo-400",
      border: "border-indigo-500/35",
      bg: "bg-indigo-900/25",
      glow: "rgba(99,102,241,0.35)",
    },
  },
  {
    id: "telegram",
    label: "Telegram",
    sublabel: "Анонсы стримов на сервере",
    href: "https://t.me/b6oJIeH",
    color: {
      icon: "text-cyan-400",
      border: "border-cyan-500/35",
      bg: "bg-cyan-900/20",
      glow: "rgba(34,211,238,0.30)",
    },
  },
  {
    id: "twitch",
    label: "Twitch",
    sublabel: "Стримы от создателя сервера",
    href: "https://www.twitch.tv/6ojieh",
    color: {
      icon: "text-purple-400",
      border: "border-purple-500/35",
      bg: "bg-purple-900/20",
      glow: "rgba(168,85,247,0.30)",
    },
  },
] as const;


export const DIAGRAM = {
  canvasW: 2400,
  canvasH: 1600,
  cardW: 116,
  cardH: 88,
  pad: 20,
  frameH: 620,
  gridCell: 48,
} as const;

export const DIAGRAM_CX = DIAGRAM.canvasW / 2;
export const DIAGRAM_CY = DIAGRAM.canvasH / 2;

export const DIAGRAM_MIN_DIST =
  Math.max(DIAGRAM.cardW, DIAGRAM.cardH) + 12;

export const DIAGRAM_COLOR = {
  gold: { bg: "bg-gold-500/10", border: "border-gold-500/40", icon: "text-gold-400", glow: "rgba(212,160,23,0.4)" },
  emerald: { bg: "bg-emerald-900/25", border: "border-emerald-500/35", icon: "text-emerald-400", glow: "rgba(52,211,153,0.3)" },
  sky: { bg: "bg-sky-900/25", border: "border-sky-500/35", icon: "text-sky-400", glow: "rgba(56,189,248,0.3)" },
  violet: { bg: "bg-violet-900/25", border: "border-violet-500/35", icon: "text-violet-400", glow: "rgba(167,139,250,0.35)" },
  rose: { bg: "bg-rose-900/25", border: "border-rose-500/35", icon: "text-rose-400", glow: "rgba(251,113,133,0.3)" },
  amber: { bg: "bg-amber-900/25", border: "border-amber-500/35", icon: "text-amber-400", glow: "rgba(251,146,60,0.35)" },
} as const;

export const DIAGRAM_LINE: Record<string, string> = {
  gold: "#d4a017",
  white: "#e6e6e6",
  emerald: "#34d399",
  sky: "#38bdf8",
  violet: "#9204cf",
  amber: "#fb923c59",
};

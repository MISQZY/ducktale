export const CANVAS_W = 2400;
export const CANVAS_H = 1600;
export const CARD_W = 116;
export const CARD_H = 88;
export const PAD = 20;
export const MIN_DIST = Math.max(CARD_W, CARD_H) + 12;

export const CX = CANVAS_W / 2;
export const CY = CANVAS_H / 2;

export const COLOR = {
  gold: { bg: "bg-gold-500/10", border: "border-gold-500/40", icon: "text-gold-400", glow: "rgba(212,160,23,0.4)" },
  emerald: { bg: "bg-emerald-900/25", border: "border-emerald-500/35", icon: "text-emerald-400", glow: "rgba(52,211,153,0.3)" },
  sky: { bg: "bg-sky-900/25", border: "border-sky-500/35", icon: "text-sky-400", glow: "rgba(56,189,248,0.3)" },
  violet: { bg: "bg-violet-900/25", border: "border-violet-500/35", icon: "text-violet-400", glow: "rgba(167,139,250,0.35)" },
  rose: { bg: "bg-rose-900/25", border: "border-rose-500/35", icon: "text-rose-400", glow: "rgba(251,113,133,0.3)" },
  amber: { bg: "bg-amber-900/25", border: "border-amber-500/35", icon: "text-amber-400", glow: "rgba(251,146,60,0.35)" },
} as const;

export const LINE: Record<string, string> = {
  gold: "#d4a017",
  white: "#e6e6e6",
  emerald: "#34d399",
  sky: "#38bdf8",
  violet: "#9204cf",
  amber: "#fb923c59",
};

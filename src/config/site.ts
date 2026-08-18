export const SITE = {
  name: "DuckTale",
  foundedYear: 2024,
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
} as const;

export const REPO = {
  slug: process.env.GITHUB_REPO ?? "your-org/your-repo",
  branch: process.env.GITHUB_REPO_BRANCH ?? "master",
  get url() {
    return `https://github.com/${this.slug}`;
  },
  editUrl(filePath: string) {
    return `${this.url}/edit/${this.branch}/${filePath}`;
  },
} as const;

/** Keys into `About.features`, in display order. */
export const FEATURE_KEYS = ["history", "protection", "community"] as const;

export interface SocialLink {
  /** Also the key into the `Social.items` message namespace. */
  id: string;
  label: string;
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
    href: "https://www.twitch.tv/6ojieh",
    color: {
      icon: "text-purple-400",
      border: "border-purple-500/35",
      bg: "bg-purple-900/20",
      glow: "rgba(168,85,247,0.30)",
    },
  },
] as const;

// ─── Diagram constants (used by components/graph) ──────────────────────────────

export const DIAGRAM = {
  cardW: 128,
  cardH: 104,
  frameH: 620,
  gridCell: 48,
} as const;

export const DIAGRAM_COLOR = {
  gold:    { bg: "bg-primary/10",    border: "border-primary/40",    icon: "text-primary",    glow: "rgba(212,160,23,0.4)"  },
  emerald: { bg: "bg-emerald-900/25", border: "border-emerald-500/35", icon: "text-emerald-400", glow: "rgba(52,211,153,0.3)"  },
  sky:     { bg: "bg-sky-900/25",     border: "border-sky-500/35",     icon: "text-sky-400",     glow: "rgba(56,189,248,0.3)"  },
  violet:  { bg: "bg-violet-900/25",  border: "border-violet-500/35",  icon: "text-violet-400",  glow: "rgba(167,139,250,0.35)"},
  rose:    { bg: "bg-rose-900/25",    border: "border-rose-500/35",    icon: "text-rose-400",    glow: "rgba(251,113,133,0.3)" },
  amber:   { bg: "bg-amber-900/25",  border: "border-amber-500/35",  icon: "text-amber-400",  glow: "rgba(251,191,36,0.35)" },
} as const;

export const DIAGRAM_LINE: Record<string, string> = {
  gold:    "#d4a017",
  white:   "#e6e6e6",
  emerald: "#34d399",
  sky:     "#38bdf8",
  violet:  "#9204cf",
  amber:   "#fbbf2459",
};

// ─── Rule table severity styles (used by docs/RuleTable.tsx) ──────────────────

export type RuleSeverity = "warn" | "ban-temp" | "ban-perm" | "prison" | "rollback" | "other";

export const RULE_SEVERITY_STYLE: Record<RuleSeverity, { badge: string; dot: string }> = {
  warn:      { dot: "bg-primary", badge: "bg-primary/10 text-primary border-primary/30" },
  "ban-temp":{ dot: "bg-primary/80", badge: "bg-card text-foreground border-primary/20" },
  "ban-perm":{ dot: "bg-destructive", badge: "bg-destructive/10 text-destructive border-destructive/30" },
  prison:    { dot: "bg-violet-500", badge: "bg-violet-500/10 text-violet-300 border-violet-500/30" },
  rollback:  { dot: "bg-sky-500", badge: "bg-sky-500/10 text-sky-300 border-sky-500/30" },
  other:     { dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground border-border" },
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const API = {
  /** Timeout for external MC-status requests (ms) */
  serverStatusTimeoutMs: 5_000,
  /** Poll interval for live status widget (ms) */
  pollIntervalMs: 90_000,
  /** Poll interval for /api/notifications (ms) — shorter than pollIntervalMs since a notification's whole point is showing up promptly as a toast, not just eventually. */
  notificationsPollIntervalMs: 20_000,
  /** How long to cache GitHub last-modified results (ms) */
  githubCacheDurationMs: 60 * 60 * 1_000,
} as const;

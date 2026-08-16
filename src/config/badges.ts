import dynamicIconImports from "lucide-react/dynamicIconImports";
import type { LocalizedName } from "@/lib/i18n-name";

export type IconName = string;
export type BadgeIconName = IconName;

/**
 * Every lucide icon (kebab-case, e.g. "trophy") is a valid Badge.icon value —
 * validated against lucide-react's own canonical name map rather than a
 * hand-maintained allowlist, since the admin panel should be able to pick
 * from the full ~2000-icon catalog. Icons render via <BadgeIcon> (which
 * wraps lucide's <DynamicIcon>), code-splitting each icon into its own tiny
 * chunk instead of bundling all of them — a given badge only ever needs the
 * one it actually uses, and the admin picker only loads the ones currently
 * visible/searched, not the whole catalog at once.
 */
export const LUCIDE_ICON_NAMES = Object.keys(dynamicIconImports) as string[];

const LUCIDE_ICON_NAME_SET = new Set<string>(LUCIDE_ICON_NAMES);

export function isBadgeIconName(value: string): boolean {
  return LUCIDE_ICON_NAME_SET.has(value) || value.startsWith("Gi");
}

/** Shown by default in the admin picker before a search is typed — a small, on-theme starting point into the full catalog. */
export const DEFAULT_BADGE_ICONS: IconName[] = [
  "trophy", "medal", "award", "star", "crown", "shield", "shield-check",
  "gem", "sparkles", "flame", "zap", "heart", "thumbs-up", "rocket",
  "badge-check", "sword", "castle", "gift", "handshake", "anchor", "compass",
];

export interface BadgeDefinition {
  key: string;
  name: LocalizedName;
  description?: string;
  earnCondition?: string;
  icon: IconName;
  color?: string;
}

/**
 * Code-defined badge catalog — seedBuiltinBadges() (src/lib/badges.ts)
 * upserts these by `key` on demand, but only ever creates a missing row,
 * never overwrites an existing one, so an admin's edits to a built-in
 * badge (via /admin/badges) survive redeploys. Add more here for badges
 * that should always exist without an admin having to create them by hand.
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: "founder",
    name: { ru: "Основатель", en: "Founder" },
    description: "Один из первых игроков сети DuckTale.",
    earnCondition: "Выдаётся вручную администрацией первым игрокам сервера.",
    icon: "crown",
    color: "#d4a017",
  },
  {
    key: "supporter",
    name: { ru: "Меценат", en: "Supporter" },
    description: "Поддержал развитие сервера.",
    earnCondition: "Выдаётся вручную администрацией.",
    icon: "heart",
    color: "#ef4444",
  },
];

"use client";

import type { CSSProperties } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import { isBadgeIconName } from "@/config/badges";

interface BadgeIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const FALLBACK_ICON = "award";

/**
 * Renders one lucide icon by (kebab-case) name via lucide's own
 * <DynamicIcon>, which fetches just that icon's tiny module on demand
 * instead of the whole ~2000-icon package being bundled — see
 * src/config/badges.ts for why the catalog isn't a hand-picked allowlist.
 * Client-only (DynamicIcon uses state/effects internally), but its parents
 * (BadgeChip, the admin icon picker) don't need to be — Server Components
 * can render this as a leaf just fine.
 */
export function BadgeIcon({ name, size, className, style }: BadgeIconProps) {
  return (
    <DynamicIcon
      name={isBadgeIconName(name) ? name : FALLBACK_ICON}
      size={size}
      className={className}
      style={style}
    />
  );
}

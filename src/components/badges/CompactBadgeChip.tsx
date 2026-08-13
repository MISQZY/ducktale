"use client";

import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { BadgeTooltipWrapper } from "./BadgeTooltipWrapper";

interface CompactBadgeChipProps {
  name: string;
  icon: string;
  color: string | null;
  description: string | null;
  earnCondition: string | null;
  size?: number;
}

/**
 * Icon-only badge indicator — no visible name/pill, just the icon with a
 * hover tooltip (name, description, earn condition). For places too tight
 * for a full BadgeChip/ProfileBadgeChip pill, e.g. next to a nickname in
 * the player rankings table.
 */
export function CompactBadgeChip({ name, icon, color, description, earnCondition, size = 14 }: CompactBadgeChipProps) {
  return (
    <BadgeTooltipWrapper name={name} description={description} earnCondition={earnCondition}>
      <BadgeIcon name={icon} size={size} style={{ color: color ?? undefined }} />
    </BadgeTooltipWrapper>
  );
}

"use client";

import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { BadgeIcon } from "@/components/badges/BadgeIcon";

interface RoleBadgeChipProps {
  name: string;
  icon: string;
  color: string | null;
  size?: number;
}

/**
 * Icon-only LuckPerms role indicator — same tight-space visual language as
 * CompactBadgeChip (site-awarded Badges), but for a live-derived role
 * (resolvePlayerTrackRoles) rather than a UserBadge row: no earnCondition/
 * description, just the name in the tooltip.
 */
export function RoleBadgeChip({ name, icon, color, size = 14 }: RoleBadgeChipProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-default shrink-0">
            <BadgeIcon name={icon} size={size} style={{ color: color ?? undefined }} />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-left">
          <p className="font-medium">{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

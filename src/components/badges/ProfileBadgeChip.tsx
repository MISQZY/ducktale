"use client";

import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { BadgeChip } from "@/components/badges/BadgeChip";

interface ProfileBadgeChipProps {
  name: string;
  icon: string;
  color: string | null;
  description: string | null;
  earnCondition: string | null;
}

/**
 * Wraps BadgeChip with a hover tooltip showing the badge's description and
 * (if set) how to earn it — profile-page-only context; the admin badges
 * list shows the same two fields as plain text instead, so it doesn't need
 * this wrapper.
 */
export function ProfileBadgeChip({ name, icon, color, description, earnCondition }: ProfileBadgeChipProps) {
  if (!description && !earnCondition) {
    return <BadgeChip name={name} icon={icon} color={color} />;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">
            <BadgeChip name={name} icon={icon} color={color} />
          </span>
        </TooltipTrigger>
        <TooltipContent className="flex-col items-start gap-1 max-w-64 text-left">
          {description && <p>{description}</p>}
          {earnCondition && <p className="text-background/70">{earnCondition}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

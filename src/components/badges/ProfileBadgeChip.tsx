"use client";

import { HelpCircle } from "lucide-react";
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
          <p className="font-medium flex items-center gap-1">
            {name}
            {earnCondition && (
              <span title={earnCondition} className="inline-flex shrink-0">
                <HelpCircle size={12} className="text-background/50" />
              </span>
            )}
          </p>
          {description && <p className="text-background/70">{description}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

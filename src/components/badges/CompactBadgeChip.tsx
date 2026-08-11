"use client";

import { HelpCircle } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { BadgeIcon } from "@/components/badges/BadgeIcon";

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
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-default shrink-0">
            <BadgeIcon name={icon} size={size} style={{ color: color ?? undefined }} />
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

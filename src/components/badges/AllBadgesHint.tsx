"use client";

import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BadgeChip } from "@/components/badges/BadgeChip";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

interface AllBadgesHintProps {
  lang: string;
  badges: { id: string; name: LocalizedName; icon: string; color: string | null }[];
}

/**
 * "?" next to the profile's Badges section title — hovering lists every
 * badge that exists in the system, not just the ones this profile has
 * earned, so a visitor can see what there is to collect.
 */
export function AllBadgesHint({ lang, badges }: AllBadgesHintProps) {
  const t = useTranslations("Account.dashboard");

  if (badges.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger type="button" tabIndex={-1} className="text-foreground/40 hover:text-foreground/70 transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent className="flex-col items-start gap-1.5 max-w-none w-56 p-2.5" side="bottom">
          <p className="text-[0.65rem] uppercase tracking-widest text-background/50 px-0.5">{t("allBadgesTitle")}</p>
          <div className="flex flex-col items-start gap-1 max-h-72 overflow-y-auto w-full">
            {badges.map((b) => (
              <BadgeChip key={b.id} name={localizedName(b.name, lang)} icon={b.icon} color={b.color} size="sm" />
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

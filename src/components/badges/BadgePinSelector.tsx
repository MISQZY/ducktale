"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { setPinnedBadge } from "@/lib/actions/account-badges";
import { ProfileBadgeChip } from "./ProfileBadgeChip";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

interface BadgeItem {
  id: string;
  name: LocalizedName;
  icon: string;
  color: string | null;
  description: string | null;
  earnCondition: string | null;
}

interface BadgePinSelectorProps {
  /** Also drives badge name resolution now (both modes), not just the setPinnedBadge Server Action call (readOnly mode skips that call but still needs this to display names). */
  lang: string;
  /** Ordered pinned-first then earliest-awarded — badges[0] is the implicit default pin when there's more than one badge. */
  badges: BadgeItem[];
  /** Raw pinned state (the badge with UserBadge.pinned=true, if any) — null means no explicit choice yet. */
  initialPinnedBadgeId: string | null;
  /** Public-profile display: shows which badge is pinned, no pin/unpin controls. */
  readOnly?: boolean;
}

/**
 * Badge grid showing which one badge is pinned to appear next to this
 * user's name on the leaderboard. With two or more badges, exactly one
 * always reads as "pinned": an explicit choice if made, otherwise badges[0]
 * — clicking the currently-effective one clears the explicit choice
 * (reverting to that default) rather than leaving nothing pinned. With a
 * single badge there's nothing to distinguish it from, so it's never shown
 * as pinned unless the user explicitly pins it (the leaderboard still picks
 * it as that user's display badge either way — that's a separate,
 * pinned-first-then-earliest DB query, unaffected by this indicator). In
 * readOnly mode (public profile) it's just an indicator, no interaction.
 */
export function BadgePinSelector({ lang, badges, initialPinnedBadgeId, readOnly = false }: BadgePinSelectorProps) {
  const t = useTranslations("Account.dashboard");
  const [explicitId, setExplicitId] = useState<string | null>(initialPinnedBadgeId);
  const [isPending, startTransition] = useTransition();

  const effectiveId = explicitId ?? (badges.length > 1 ? badges[0]?.id : undefined) ?? null;

  function togglePin(badgeId: string) {
    if (readOnly) return;
    const next = effectiveId === badgeId ? null : badgeId;
    const previous = explicitId;
    setExplicitId(next);
    startTransition(async () => {
      try {
        await setPinnedBadge(lang, next);
      } catch {
        setExplicitId(previous);
      }
    });
  }

  // Wraps and centers for a handful of badges (the common case); beyond
  // that, wrapping just turns into several centered rows of ragged length,
  // which reads worse than one horizontally-scrollable row.
  const isCompact = badges.length <= 8;

  return (
    <div
      className={cn(
        "flex gap-2",
        isCompact
          ? "flex-wrap justify-center"
          : "flex-nowrap overflow-x-auto justify-start pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      )}
    >
      {badges.map((badge) => {
        const isPinned = effectiveId === badge.id;
        return (
          <div key={badge.id} className="relative group/pin shrink-0">
            <ProfileBadgeChip
              name={localizedName(badge.name, lang)}
              icon={badge.icon}
              color={badge.color}
              description={badge.description}
              earnCondition={badge.earnCondition}
            />
            {readOnly ? (
              isPinned && (
                <span
                  title={t("pinnedBadgeHint")}
                  aria-label={t("pinnedBadgeHint")}
                  className="absolute -top-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full border bg-primary text-primary-foreground border-primary"
                >
                  <Pin size={7} className="fill-current" />
                </span>
              )
            ) : (
              <button
                type="button"
                onClick={() => togglePin(badge.id)}
                disabled={isPending}
                title={isPinned ? t("unpinBadge") : t("pinBadge")}
                aria-label={isPinned ? t("unpinBadge") : t("pinBadge")}
                aria-pressed={isPinned}
                className={cn(
                  "absolute -top-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full border transition-colors disabled:opacity-50",
                  isPinned
                    ? "bg-primary text-primary-foreground border-primary opacity-100"
                    : "bg-card/90 border-primary/25 text-foreground/40 opacity-0 group-hover/pin:opacity-100 hover:text-primary/80 hover:border-primary/40"
                )}
              >
                <Pin size={7} className={cn(isPinned && "fill-current")} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

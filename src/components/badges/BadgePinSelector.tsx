"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { setPinnedBadge } from "@/lib/actions/account-badges";
import { ProfileBadgeChip } from "./ProfileBadgeChip";

interface BadgeItem {
  id: string;
  name: string;
  icon: string;
  color: string | null;
  description: string | null;
  earnCondition: string | null;
}

interface BadgePinSelectorProps {
  /** Required unless readOnly — passed through to the setPinnedBadge Server Action. */
  lang?: string;
  /** Ordered pinned-first then earliest-awarded — badges[0] is the implicit default pin. */
  badges: BadgeItem[];
  /** Raw pinned state (the badge with UserBadge.pinned=true, if any) — null means no explicit choice yet. */
  initialPinnedBadgeId: string | null;
  /** Public-profile display: shows which badge is pinned, no pin/unpin controls. */
  readOnly?: boolean;
}

/**
 * Badge grid showing which one badge is pinned to appear next to this
 * user's name on the leaderboard. Exactly one badge always reads as
 * "pinned": an explicit choice if made, otherwise badges[0] — clicking the
 * currently-effective one clears the explicit choice (reverting to that
 * default) rather than leaving nothing pinned. In readOnly mode (public
 * profile) it's just an indicator, no interaction.
 */
export function BadgePinSelector({ lang, badges, initialPinnedBadgeId, readOnly = false }: BadgePinSelectorProps) {
  const t = useTranslations("Account.dashboard");
  const [explicitId, setExplicitId] = useState<string | null>(initialPinnedBadgeId);
  const [isPending, startTransition] = useTransition();

  const effectiveId = explicitId ?? badges[0]?.id ?? null;

  function togglePin(badgeId: string) {
    if (readOnly || !lang) return;
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

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {badges.map((badge) => {
        const isPinned = effectiveId === badge.id;
        return (
          <div key={badge.id} className="relative group/pin">
            <ProfileBadgeChip
              name={badge.name}
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

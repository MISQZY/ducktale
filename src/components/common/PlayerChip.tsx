import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SkinFace } from "@/components/common/SkinFace";
import { HighlightMatch } from "@/components/docs/paged-table";
import { CompactBadgeChip } from "@/components/badges/CompactBadgeChip";
import { useTranslations } from "next-intl";

const MAX_VISIBLE_BADGES = 3;

export interface PlayerChipProps {
  name: string;
  profileUsername: string | null;
  skinUrl: string | null;
  online: boolean;
  badges: {
    name: string;
    icon: string;
    color: string | null;
    description: string | null;
    earnCondition: string | null;
  }[];
  query?: string;
  className?: string;
}

export function PlayerChip({
  name,
  profileUsername,
  skinUrl,
  online,
  badges,
  query = "",
  className,
}: PlayerChipProps) {
  const tCard = useTranslations("PlayerCard");

  if (profileUsername) {
    return (
      <Link
        href={`/profile/${encodeURIComponent(profileUsername)}`}
        target="_blank"
        className={cn(
          "relative overflow-hidden inline-flex h-11 items-center gap-3 py-1.5 pr-5 pl-1.5 rounded-lg border bg-card/40 transition-colors shadow-sm group hover:bg-card/60",
          online ? "animate-border-glow-green border-emerald-500/40" : "border-primary/20 hover:border-primary/40",
          className
        )}
      >
        <SkinFace skinUrl={skinUrl} size={32} className="rounded-md border-none shrink-0" />
        <div className="flex items-center gap-2.5 relative z-10">
          <HighlightMatch
            text={name}
            query={query}
            className="font-bold text-amber-600 dark:text-amber-400 text-base transition-colors group-hover:text-amber-500 dark:group-hover:text-amber-300"
          />
          
          {badges.length > 0 && (
            <div className="flex items-center gap-1">
              {badges.slice(0, MAX_VISIBLE_BADGES).map((badge) => (
                <CompactBadgeChip
                  key={badge.name}
                  name={badge.name}
                  icon={badge.icon}
                  color={badge.color}
                  description={badge.description}
                  earnCondition={badge.earnCondition}
                  size={17}
                />
              ))}
              {badges.length > MAX_VISIBLE_BADGES && (
                <span
                  className="text-[0.65rem] text-foreground/40 shrink-0"
                  title={badges.slice(MAX_VISIBLE_BADGES).map((b) => b.name).join(", ")}
                >
                  +{badges.length - MAX_VISIBLE_BADGES}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className={cn("flex h-11 items-center gap-2", className)}>
      <HighlightMatch text={name} query={query} className="text-base" />
      {online && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" title={tCard("online")}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { ChevronDown, Crown, ShieldCheck } from "lucide-react";
import { DuckBadge } from "@/components/ui/duck/badge";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HighlightMatch } from "@/components/docs/paged-table";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";
import { resolveMinecraftColor } from "@/lib/minecraft-colors";
import { RESIDENT_ROLE_COLOR } from "@/lib/towny";
import type { Resident, ResidentRole } from "@/types/towny";

export interface TownNameLabelProps {
  tag:   string | null;
  name:  string;
  query: string;
  /**
   * "dot" (default): a separate color swatch before the name, used by the
   * docs towns table. "text": no swatch — the name itself is colored
   * instead, used by the ranking table where a swatch-per-row reads as
   * clutter next to the rank medal/badge already carrying color.
   */
  variant?: "dot" | "text";
}

/**
 * Town identity cell (from the town's own Towny tag color) + name,
 * highlighted against an active search query — shared by the docs towns
 * table and the town ranking table.
 */
export function TownNameLabel({ tag, name, query, variant = "dot" }: TownNameLabelProps) {
  const color = resolveMinecraftColor(tag);
  // text-base/semibold to match the player table's name column (PlayerAvatar's
  // own name text is text-sm but font-bold, plus a 36px avatar next to it —
  // without an avatar here, matching just the weight still read smaller/thinner).
  const nameClassName = "text-base font-semibold";

  if (variant === "text") {
    return <HighlightMatch text={name} query={query} className={nameClassName} style={{ color, textShadow: "-1px -1px 0 rgba(0,0,0,0.25), 1px -1px 0 rgba(0,0,0,0.25), -1px 1px 0 rgba(0,0,0,0.25), 1px 1px 0 rgba(0,0,0,0.25)" }} />;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <HighlightMatch text={name} query={query} className={nameClassName} />
    </span>
  );
}

// Badge chrome (border/bg) layered on top of the role's shared text color —
// see RESIDENT_ROLE_COLOR in @/lib/towny, also used by the player card.
export const RESIDENT_BADGE_STYLE: Record<Exclude<ResidentRole, null>, string> = {
  mayor:  cn("border-gold-500/40 bg-gold-500/10", RESIDENT_ROLE_COLOR.mayor),
  deputy: cn("border-slate-400/40 bg-slate-400/10", RESIDENT_ROLE_COLOR.deputy),
};

const ROLE_ICON: Partial<Record<Exclude<ResidentRole, null>, typeof Crown>> = {
  mayor:  Crown,
  deputy: ShieldCheck,
};

/** One resident row: avatar, "nickname (username)", role-colored border + role icon before the name. */
function ResidentEntry({ resident }: { resident: Resident }) {
  const RoleIcon = resident.role ? ROLE_ICON[resident.role] : undefined;

  return (
    <PlayerAvatar
      name={resident.username}
      skinUrl={resident.skinUrl}
      hasSiteProfile={false}
      avatarSize={24}
      avatarClassName="rounded-md border-none"
      growName={false}
      className={cn(
        "rounded-lg border px-2 py-1.5",
        resident.role ? RESIDENT_BADGE_STYLE[resident.role] : "border-border bg-card/60"
      )}
      nameNode={
        <span className="flex items-center gap-1 min-w-0">
          {RoleIcon && <RoleIcon size={12} className="shrink-0" />}
          <span className="text-xs font-medium truncate">
            {resident.nickname}{" "}
            <span className="font-normal opacity-60">({resident.username})</span>
          </span>
        </span>
      }
    />
  );
}

/** Resident list — shared by the docs towns table and the ranking table, both opened from a Popover anchored to the town name. */
export function ResidentBadges({ residents }: { residents: Resident[] }) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <span className={cn("text-[11px] font-bold uppercase tracking-widest", DOCS_TABLE_THEME.accent)}>
        Жители
      </span>
      <div className="flex flex-col gap-1.5 min-w-0">
        {residents.map((resident) => (
          <ResidentEntry key={resident.username} resident={resident} />
        ))}
      </div>
    </div>
  );
}

export interface TownNameCellProps {
  tag:       string | null;
  name:      string;
  query:     string;
  residents: Resident[];
}

/**
 * Town name cell with an expandable resident list — shared by the docs
 * towns table and the ranking table. A Popover (Radix, portaled to
 * document.body) rather than an inserted accordion <tr>: the latter used to
 * push every row below it down and reflow the pagination footer on every
 * expand/collapse. The portal renders on top of the table instead, so
 * nothing else in the layout moves.
 */
export function TownNameCell({ tag, name, query, residents }: TownNameCellProps) {
  const hasResidents = residents.length > 0;

  if (!hasResidents) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="w-3.25 shrink-0" />
        <TownNameLabel tag={tag} name={name} query={query} variant="text" />
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group/town flex items-center gap-1.5 text-left cursor-pointer"
        >
          <ChevronDown
            size={13}
            className={cn(
              "shrink-0 transition-transform duration-200",
              DOCS_TABLE_THEME.iconFaint,
              "group-hover/town:text-foreground",
              "group-data-[state=open]/town:rotate-180"
            )}
          />
          <TownNameLabel tag={tag} name={name} query={query} variant="text" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-fit max-w-[calc(100vw-2rem)]">
        <ResidentBadges residents={residents} />
      </PopoverContent>
    </Popover>
  );
}

export interface TownNationBadgeProps {
  nation: string | null;
  nationTag: string | null;
  /** Caller-supplied so each table keeps its own i18n convention (the docs table isn't localized; the ranking table is). */
  independentLabel: string;
}

/** Nation badge colored from the nation's own tag, or an "independent" fallback when the town has none. */
export function TownNationBadge({ nation, nationTag, independentLabel }: TownNationBadgeProps) {
  if (!nation) {
    return <span className={cn("text-xs italic", DOCS_TABLE_THEME.textFaint)}>{independentLabel}</span>;
  }

  const nationColor = resolveMinecraftColor(nationTag);
  return (
    <DuckBadge
      variant="outline"
      className="text-xs"
      style={{
        color: nationColor,
        borderColor: nationColor,
        backgroundColor: `${nationColor}1A`,
      }}
    >
      {nation}
    </DuckBadge>
  );
}

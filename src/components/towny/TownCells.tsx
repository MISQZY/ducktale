import { cn } from "@/lib/utils";
import { DuckBadge } from "@/components/ui/duck/badge";
import { HighlightMatch } from "@/components/docs/paged-table";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";
import { resolveMinecraftColor } from "@/lib/minecraft-colors";

/**
 * Color dot (from the town's own Towny tag) + name, highlighted against an
 * active search query — the town-identity cell shared by the docs towns
 * table and the town ranking table.
 */
export function TownNameLabel({ tag, name, query }: { tag: string | null; name: string; query: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
        style={{ backgroundColor: resolveMinecraftColor(tag) }}
        aria-hidden="true"
      />
      <HighlightMatch text={name} query={query} />
    </span>
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

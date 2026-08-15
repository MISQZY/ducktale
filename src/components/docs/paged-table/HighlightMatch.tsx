import { cn } from "@/lib/utils";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";

interface HighlightMatchProps {
  text:      string;
  query:     string;
  className?: string;
  /** e.g. a Minecraft-tag-derived text color (see TownNameLabel's "text" variant) — set here rather than via className since it overrides DOCS_TABLE_THEME.textSoft's own class only when it's on the same element. */
  style?: React.CSSProperties;
}

/** Renders text with the query substring highlighted. */
export function HighlightMatch({ text, query, className, style }: HighlightMatchProps) {
  const base = cn("text-sm font-medium", DOCS_TABLE_THEME.textSoft, className);

  if (!query.trim()) return <span className={base} style={style}>{text}</span>;

  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1)    return <span className={base} style={style}>{text}</span>;

  const len = query.trim().length;
  return (
    <span className={base} style={style}>
      {text.slice(0, idx)}
      <mark className={cn(DOCS_TABLE_THEME.markBg, DOCS_TABLE_THEME.accent, "rounded-sm px-0.5 not-italic")}>
        {text.slice(idx, idx + len)}
      </mark>
      {text.slice(idx + len)}
    </span>
  );
}

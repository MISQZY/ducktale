import { cn } from "@/lib/utils";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";

interface HighlightMatchProps {
  text:      string;
  query:     string;
  className?: string;
}

/** Renders text with the query substring highlighted. */
export function HighlightMatch({ text, query, className }: HighlightMatchProps) {
  const base = cn("text-sm font-medium", DOCS_TABLE_THEME.textSoft, className);

  if (!query.trim()) return <span className={base}>{text}</span>;

  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1)    return <span className={base}>{text}</span>;

  const len = query.trim().length;
  return (
    <span className={base}>
      {text.slice(0, idx)}
      <mark className="bg-[#FFCA28]/20 text-[#FFE289] rounded-sm px-0.5 not-italic">
        {text.slice(idx, idx + len)}
      </mark>
      {text.slice(idx + len)}
    </span>
  );
}
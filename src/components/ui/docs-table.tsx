import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// Single source of truth for the "docs table" gold/amber palette. Every
// component under src/components/docs/paged-table previously re-declared
// these same hex literals locally — extend this object instead of adding
// new raw colors so the palette stays in exactly one place.
export const DOCS_TABLE_THEME = {
  wrapper:   "not-prose w-full overflow-hidden rounded-xl border border-border bg-card",
  header:    "bg-muted border-border",
  // Column-divider strength — was border-border/50, which washed out badly
  // next to the row dividers (plain border-b, full theme opacity) and the
  // new resize-handle hover line. Matches that full strength now instead of
  // being the one faint line in an otherwise crisp grid.
  grid:      "border-border",
  text:      "text-foreground",
  textSoft:  "text-muted-foreground",
  textFaint: "text-muted-foreground/70",
  accent:    "text-primary",
  codeBg:    "bg-muted",
  codeText:  "text-primary",
  rowHover:  "hover:bg-primary/5",

  // Interactive / input surfaces (pagination, search, skeleton, highlight)
  surfaceBg:      "bg-card",
  border:         "border-border",
  borderHover:    "hover:border-primary/50",
  borderFocus:    "focus:border-primary",
  iconMuted:      "text-muted-foreground",
  iconFaint:      "text-muted-foreground/70",
  iconFaintHover: "hover:text-foreground",
  placeholder:    "placeholder:text-muted-foreground",
  skeletonBg:     "bg-muted",
  markBg:         "bg-primary/20",
  activeBg:       "bg-primary/10",
  activeText:     "text-primary",
  activeBorder:   "border-primary",
  inactiveText:   "text-muted-foreground",
  inactiveHoverText: "hover:text-foreground",
} as const;

export interface DocsTableProps extends React.ComponentPropsWithoutRef<typeof Table> {
  wrapperClassName?: string;
}

export function DocsTable({ className, wrapperClassName, children, ...props }: DocsTableProps) {
  return (
    <div className={cn(DOCS_TABLE_THEME.wrapper, wrapperClassName)}>
      <Table className={cn("border-collapse", className)} {...props}>
        {children}
      </Table>
    </div>
  );
}

export function DocsTableHeader({ className, ...props }: React.ComponentPropsWithoutRef<typeof TableHeader>) {
  return (
    <TableHeader
      className={cn(DOCS_TABLE_THEME.header, DOCS_TABLE_THEME.grid, className)}
      {...props}
    />
  );
}

export function DocsTableBody(props: React.ComponentPropsWithoutRef<typeof TableBody>) {
  return <TableBody {...props} />;
}

export function DocsTableRow({ className, ...props }: React.ComponentPropsWithoutRef<typeof TableRow>) {
  return (
    <TableRow
      className={cn(DOCS_TABLE_THEME.rowHover, className)}
      {...props}
    />
  );
}

export interface DocsTableHeadProps extends React.ComponentPropsWithoutRef<typeof TableHead> {
  withRightBorder?: boolean;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | undefined;
  onSort?: () => void;
  /** Column-resize drag handle — rendered as a sibling after the sort button, not inside it, so dragging it never also fires onSort. See DataTableHeader in data-table.tsx. */
  resizeHandle?: React.ReactNode;
}

export function DocsTableHead({ className, withRightBorder, sortable, sortDirection, onSort, resizeHandle, children, ...props }: DocsTableHeadProps) {
  const content = sortable ? (
    <button
      type="button"
      onClick={onSort}
      className={cn(
        "flex w-full items-center gap-1.5 transition-colors focus:outline-none hover:opacity-80",
        className?.includes("text-center") ? "justify-center" : className?.includes("text-right") ? "justify-end" : "justify-between"
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
      {sortDirection === "asc" ? (
        <ChevronUp size={14} className="shrink-0" />
      ) : sortDirection === "desc" ? (
        <ChevronDown size={14} className="shrink-0" />
      ) : (
        <ChevronsUpDown size={14} className="shrink-0 opacity-40 hover:opacity-100 transition-opacity" />
      )}
    </button>
  ) : (
    children
  );

  return (
    <TableHead
      className={cn(
        "relative px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest overflow-hidden",
        DOCS_TABLE_THEME.accent,
        withRightBorder
          ? cn("border-r", DOCS_TABLE_THEME.grid)
          : cn("not-last:border-r", DOCS_TABLE_THEME.grid),
        className
      )}
      {...props}
    >
      {content}
      {resizeHandle}
    </TableHead>
  );
}

export interface DocsTableCellProps extends React.ComponentPropsWithoutRef<typeof TableCell> {
  withRightBorder?: boolean;
}

export function DocsTableCell({ className, withRightBorder, ...props }: DocsTableCellProps) {
  return (
    <TableCell
      className={cn(
        "align-top px-4 py-3.5 overflow-hidden",
        DOCS_TABLE_THEME.text,
        withRightBorder
          ? cn("border-r", DOCS_TABLE_THEME.grid)
          : cn("not-last:border-r", DOCS_TABLE_THEME.grid),
        className
      )}
      {...props}
    />
  );
}
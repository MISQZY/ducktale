import * as React from "react";
import { cn } from "@/lib/utils";
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
  grid:      "border-border/50",
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
}

export function DocsTableHead({ className, withRightBorder, ...props }: DocsTableHeadProps) {
  return (
    <TableHead
      className={cn(
        "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest",
        DOCS_TABLE_THEME.accent,
        withRightBorder
          ? cn("border-r", DOCS_TABLE_THEME.grid)
          : cn("not-last:border-r", DOCS_TABLE_THEME.grid),
        className
      )}
      {...props}
    />
  );
}

export interface DocsTableCellProps extends React.ComponentPropsWithoutRef<typeof TableCell> {
  withRightBorder?: boolean;
}

export function DocsTableCell({ className, withRightBorder, ...props }: DocsTableCellProps) {
  return (
    <TableCell
      className={cn(
        "align-top px-4 py-3.5",
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
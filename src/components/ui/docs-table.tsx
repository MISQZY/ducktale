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

export const DOCS_TABLE_THEME = {
  wrapper:   "not-prose w-full overflow-hidden rounded-xl border border-[#BFA246]/18 bg-[#12100c]",
  header:    "bg-[#1a1711] border-[#BFA246]/14",
  grid:      "border-[#BFA246]/12",
  text:      "text-[#FFF4CC]/88",
  textSoft:  "text-[#FFE289]/72",
  textFaint: "text-[#FFE289]/42",
  accent:    "text-[#FFE289]",
  codeBg:    "bg-[#201b12]",
  rowHover:  "hover:bg-[#FFCA28]/[0.03]",
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
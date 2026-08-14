"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
import { Fragment, type ReactNode } from "react";

/**
 * Per-column metadata this project's DocsTable* primitives need beyond what
 * @tanstack/react-table's ColumnDef already covers: cell/header alignment
 * and the border between columns (the existing "docs table" look), plus how
 * a column plugs into this app's server-driven sorting. Every table here
 * sorts/paginates/filters on the server (see usePagedTable / RSC
 * searchParams) — sortKey identifies the column to the *server's* sort
 * param, not to TanStack's own (unused) sorting state.
 */
export interface DataTableColumnMeta {
  headClassName?: string;
  cellClassName?: string;
  withRightBorder?: boolean;
  sortKey?: string;
  /** What the first click on this column's header should mean — "desc" for a "biggest first" numeric column, "asc" for a rank/alphabetical one. */
  defaultSortDirection?: "asc" | "desc";
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
  interface ColumnMeta<TData, TValue> extends DataTableColumnMeta {}
}

/**
 * Builds the row/column model for a page of already-fetched, already-sorted
 * data — manual* everywhere because pagination/sorting/filtering all happen
 * server-side (usePagedTable's fetcher, or the RSC page's own Prisma query),
 * never in the browser. getRowId lets callers key rows by their real id
 * (player uuid, ticket id, ...) instead of TanStack's default row index.
 */
export function useDataTable<TData>(
  columns: ColumnDef<TData, unknown>[],
  data: TData[],
  getRowId?: (row: TData, index: number) => string
) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    ...(getRowId ? { getRowId } : {}),
  });
}

interface DataTableHeaderProps<TData> {
  table: TanstackTable<TData>;
  /** Current server-side sort state + handler — see useDataTable's doc comment on why this isn't TanStack's own sorting state. */
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string, defaultDirection?: "asc" | "desc") => void;
}

export function DataTableHeader<TData>({ table, sortColumn, sortDirection, onSort }: DataTableHeaderProps<TData>) {
  return (
    <DocsTableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <DocsTableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const meta = header.column.columnDef.meta;
            const sortKey = meta?.sortKey;
            return (
              <DocsTableHead
                key={header.id}
                className={meta?.headClassName}
                withRightBorder={meta?.withRightBorder}
                sortable={!!sortKey}
                sortDirection={sortKey && sortColumn === sortKey ? sortDirection : undefined}
                onSort={sortKey ? () => onSort?.(sortKey, meta.defaultSortDirection) : undefined}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </DocsTableHead>
            );
          })}
        </DocsTableRow>
      ))}
    </DocsTableHeader>
  );
}

interface DataTableBodyProps<TData> {
  table: TanstackTable<TData>;
  rowClassName?: (row: TData) => string | undefined;
  /** Renders an additional row right after a data row's own — for the one table (TownyTable) with an expandable accordion sub-row, since that doesn't fit TanStack's one-row-per-item column/cell model. Omit for every other table. */
  renderExtraRow?: (row: TData) => ReactNode;
}

export function DataTableBody<TData>({ table, rowClassName, renderExtraRow }: DataTableBodyProps<TData>) {
  return (
    <>
      {table.getRowModel().rows.map((row) => (
        <Fragment key={row.id}>
          <DocsTableRow className={rowClassName?.(row.original)}>
            {row.getVisibleCells().map((cell) => {
              const meta = cell.column.columnDef.meta;
              return (
                <DocsTableCell key={cell.id} className={meta?.cellClassName} withRightBorder={meta?.withRightBorder}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </DocsTableCell>
              );
            })}
          </DocsTableRow>
          {renderExtraRow?.(row.original)}
        </Fragment>
      ))}
    </>
  );
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  rowClassName?: (row: TData) => string | undefined;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string, defaultDirection?: "asc" | "desc") => void;
  emptyMessage?: ReactNode;
}

/**
 * Convenience wrapper for the RSC/server-paginated admin tables: data is
 * always already fetched by the time this renders (no loading state to
 * account for), so this owns the empty state itself instead of leaving it
 * to the caller. Client-fetched tables (PagedTableLayout) use
 * DataTableHeader/DataTableBody directly instead, since they also need to
 * interleave a loading skeleton and an error state around the same table.
 */
export function DataTable<TData>({
  columns, data, getRowId, rowClassName, sortColumn, sortDirection, onSort, emptyMessage,
}: DataTableProps<TData>) {
  const table = useDataTable(columns, data, getRowId);

  return (
    <DocsTable>
      <DataTableHeader table={table} sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
      <DocsTableBody className="[&_tr:last-child]:border-0">
        {data.length === 0 ? (
          <DocsTableRow>
            <DocsTableCell colSpan={columns.length} className="text-center py-10">
              <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>{emptyMessage}</p>
            </DocsTableCell>
          </DocsTableRow>
        ) : (
          <DataTableBody table={table} rowClassName={rowClassName} />
        )}
      </DocsTableBody>
    </DocsTable>
  );
}

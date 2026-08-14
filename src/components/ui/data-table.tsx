"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Table as TanstackTable,
  type Header,
  type VisibilityState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

/** Every table gets this as its actual first column — see useDataTable. Not part of the columns[] a caller declares. */
const ROW_NUMBER_COLUMN_ID = "__rowNumber";

function buildRowNumberColumn<TData>(rowOffset: number): ColumnDef<TData, unknown> {
  return {
    id: ROW_NUMBER_COLUMN_ID,
    header: "№",
    size: 44,
    minSize: 36,
    maxSize: 64,
    enableHiding: false,
    meta: {
      headClassName: "text-center align-middle",
      cellClassName: cn("text-center align-middle font-mono tabular-nums text-xs", DOCS_TABLE_THEME.textFaint),
      withRightBorder: true,
    },
    cell: ({ row }) => rowOffset + row.index + 1,
  };
}

/**
 * Builds the row/column model for a page of already-fetched, already-sorted
 * data — manual* everywhere because pagination/sorting/filtering all happen
 * server-side (usePagedTable's fetcher, or the RSC page's own Prisma query),
 * never in the browser. getRowId lets callers key rows by their real id
 * (player uuid, ticket id, ...) instead of TanStack's default row index.
 *
 * Every table gets an automatic, non-hideable "№" row-number column
 * prepended ahead of whatever columns the caller declares — rowOffset is
 * the 0-based index of the first row on the current page (i.e. pageStart /
 * (page-1)*pageSize), so numbering stays continuous across pages instead of
 * restarting at 1 on every page. Pass showRowNumber={false} for a table
 * that already has its own leading rank/position column (the leaderboard
 * tables' medal-badge "rank" column) — otherwise numbering would be
 * duplicated, once generically and once with real meaning.
 *
 * Column visibility and widths are the one bit of state that *is* purely
 * client-side (which columns you'd rather hide, how wide you dragged one) —
 * scoped to this hook call, so it resets on remount/reload rather than
 * persisting, same as every other ephemeral UI preference in this app.
 */
export function useDataTable<TData>(
  columns: ColumnDef<TData, unknown>[],
  data: TData[],
  getRowId?: (row: TData, index: number) => string,
  rowOffset = 0,
  showRowNumber = true
) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const columnsWithRowNumber = useMemo<ColumnDef<TData, unknown>[]>(
    () => (showRowNumber ? [buildRowNumberColumn<TData>(rowOffset), ...columns] : columns),
    [columns, rowOffset, showRowNumber]
  );

  return useReactTable({
    data,
    columns: columnsWithRowNumber,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: { columnVisibility, columnSizing },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
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

function ResizeHandle<TData>({ header }: { header: Header<TData, unknown> }) {
  if (!header.column.getCanResize()) return null;
  const isResizing = header.column.getIsResizing();
  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={() => header.column.resetSize()}
      onClick={(e) => e.stopPropagation()}
      role="separator"
      aria-orientation="vertical"
      title="Потяните, чтобы изменить ширину — двойной клик сбрасывает"
      className="absolute right-0 top-0 z-10 h-full w-2.5 cursor-col-resize touch-none select-none"
    >
      {/* Transparent by default — the real column divider is DocsTableHead's
          own border-r, drawn at this same right edge. This only paints a
          (highlighted) line on top of it while hovering/dragging; left
          fully transparent otherwise, it would double up as a second,
          slightly-offset divider next to the real one. */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-0.5 bg-transparent transition-colors",
          isResizing ? "bg-primary" : "hover:bg-primary/70"
        )}
      />
    </div>
  );
}

/**
 * `<colgroup>` is the authoritative, cross-browser-reliable way to set
 * per-column widths under `table-layout: fixed` — setting `style={{width}}`
 * on individual `<th>`/`<td>` cells instead (the more common TanStack-table
 * example) reads their width from whichever row's cells are actually
 * present, which broke down for the empty-state row (a single cell
 * `colSpan`-ing every column, so there's no per-column width to read there)
 * — the header lost its intended widths and stopped filling the table.
 * colgroup doesn't have that failure mode: it fixes every column's width up
 * front, independent of what any given row's cells look like.
 */
export function DataTableColGroup<TData>({ table }: { table: TanstackTable<TData> }) {
  // getVisibleLeafColumns, not getAllLeafColumns — colgroup assigns widths
  // positionally, and DataTableHeader/DataTableBody only ever render visible
  // columns' cells. Including hidden columns here would desync <col> count
  // from actual <th>/<td> count the moment someone hides a column via the
  // "Столбцы" toggle, misassigning every width after the hidden one.
  return (
    <colgroup>
      {table.getVisibleLeafColumns().map((column) => (
        <col key={column.id} style={{ width: column.getSize() }} />
      ))}
    </colgroup>
  );
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
                resizeHandle={<ResizeHandle header={header} />}
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
                <DocsTableCell
                  key={cell.id}
                  className={meta?.cellClassName}
                  withRightBorder={meta?.withRightBorder}
                >
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

/**
 * "Columns" popover — checkbox per hideable column, toggling TanStack's own
 * columnVisibility state (see useDataTable). Column labels come straight
 * from each ColumnDef's `header`, which is a plain translated string on
 * every table in this app (never a rendered element), so it's safe to use
 * directly as checkbox text.
 */
export function DataTableViewOptions<TData>({ table }: { table: TanstackTable<TData> }) {
  const columns = table.getAllLeafColumns().filter((c) => c.getCanHide());
  if (columns.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={cn("gap-1", DOCS_TABLE_THEME.textSoft)}
        >
          <SlidersHorizontal size={12} />
          Столбцы
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="flex flex-col gap-0.5">
          {columns.map((column) => {
            const label = typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
            return (
              <label
                key={column.id}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground/80 hover:bg-muted cursor-pointer select-none"
              >
                <Checkbox
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                />
                {label}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
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
  /** 0-based index of this page's first row, for the automatic row-number column (see useDataTable). Omit for unpaginated tables. */
  rowOffset?: number;
  /** Set false if `columns` already leads with its own rank/position column — see useDataTable. Default true. */
  showRowNumber?: boolean;
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
  columns, data, getRowId, rowClassName, sortColumn, sortDirection, onSort, emptyMessage, rowOffset, showRowNumber = true,
}: DataTableProps<TData>) {
  const table = useDataTable(columns, data, getRowId, rowOffset, showRowNumber);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-end">
        <DataTableViewOptions table={table} />
      </div>
      {/* min-width (not width): the table should still stretch to fill a wide
          container via w-full, and only actually get wider — triggering the
          horizontal scroll from Table's own wrapper div — once the sum of
          column sizes genuinely needs more room than that. */}
      <DocsTable className="table-fixed w-full" style={{ minWidth: table.getTotalSize() }}>
        <DataTableColGroup table={table} />
        <DataTableHeader table={table} sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
        <DocsTableBody className="[&_tr:last-child]:border-0">
          {data.length === 0 ? (
            <DocsTableRow>
              <DocsTableCell colSpan={showRowNumber ? columns.length + 1 : columns.length} className="text-center py-10">
                <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>{emptyMessage}</p>
              </DocsTableCell>
            </DocsTableRow>
          ) : (
            <DataTableBody table={table} rowClassName={rowClassName} />
          )}
        </DocsTableBody>
      </DocsTable>
    </div>
  );
}

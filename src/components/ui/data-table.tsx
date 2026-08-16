"use client";

import { flexRender } from "@tanstack/react-table";
import {
  useLegacyTable,
  type LegacyColumnDef,
  type LegacyTable,
  type LegacyHeader,
} from "@tanstack/react-table/legacy";
import type { TableFeatures, RowData, ColumnVisibilityState, ColumnSizingState } from "@tanstack/table-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";
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

// v8-shaped aliases over TanStack Table v9's useLegacyTable compat types —
// every admin table's own ColumnDef<TData, unknown> import comes from here
// now, not "@tanstack/react-table" directly, so this is the one place that
// needs to know about the useLegacyTable shim (see useDataTable's doc
// comment below for why it exists at all).
export type ColumnDef<TData extends RowData, TValue = unknown> = LegacyColumnDef<TData, TValue>;
export type TanstackTable<TData extends RowData> = LegacyTable<TData>;
export type Header<TData extends RowData, TValue = unknown> = LegacyHeader<TData, TValue>;
export type VisibilityState = ColumnVisibilityState;

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

declare module "@tanstack/table-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
  interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue> extends DataTableColumnMeta {}
}

/** Every table gets this as its actual first column — see useDataTable. Not part of the columns[] a caller declares. */
const ROW_NUMBER_COLUMN_ID = "__rowNumber";

function buildRowNumberColumn<TData extends RowData>(rowOffset: number): ColumnDef<TData, unknown> {
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
 *
 * Runs on TanStack Table v9's `useLegacyTable` compat shim (not the native
 * v9 `useTable({ features, ... })` API) — v9 restructured pagination/
 * sorting/filtering/resizing into opt-in, tree-shakeable "features" with a
 * different config shape entirely; the legacy shim keeps this file (and
 * every ColumnDef in every admin table importing its `ColumnDef` type
 * below) on the v8-shaped API this app already uses, deliberately deferring
 * the native-v9 rewrite rather than bundling it into the version bump.
 */
export function useDataTable<TData extends RowData>(
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

  return useLegacyTable({
    data,
    columns: columnsWithRowNumber,
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

interface DataTableHeaderProps<TData extends RowData> {
  table: TanstackTable<TData>;
  /** Current server-side sort state + handler — see useDataTable's doc comment on why this isn't TanStack's own sorting state. */
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string, defaultDirection?: "asc" | "desc") => void;
}

function ResizeHandle<TData extends RowData>({ header }: { header: Header<TData, unknown> }) {
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
export function DataTableColGroup<TData extends RowData>({ table }: { table: TanstackTable<TData> }) {
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

export function DataTableHeader<TData extends RowData>({ table, sortColumn, sortDirection, onSort }: DataTableHeaderProps<TData>) {
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

interface DataTableBodyProps<TData extends RowData> {
  table: TanstackTable<TData>;
  rowClassName?: (row: TData) => string | undefined;
  /** Renders an additional row right after a data row's own — for the one table (TownyTable) with an expandable accordion sub-row, since that doesn't fit TanStack's one-row-per-item column/cell model. Omit for every other table. */
  renderExtraRow?: (row: TData) => ReactNode;
}

export function DataTableBody<TData extends RowData>({ table, rowClassName, renderExtraRow }: DataTableBodyProps<TData>) {
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
 * directly as checkbox text. Icon-only trigger (matches the app's other
 * small icon buttons — ThemeToggle, SkinViewButton, ...) rather than a
 * labeled button, so it sits flush in a toolbar row next to search/create.
 */
export function DataTableViewOptions<TData extends RowData>({ table }: { table: TanstackTable<TData> }) {
  const columns = table.getAllLeafColumns().filter((c) => c.getCanHide());
  if (columns.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Столбцы"
          aria-label="Столбцы"
          className={DOCS_TABLE_THEME.textSoft}
        >
          <Settings size={14} />
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

interface DataTableProps<TData extends RowData> {
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
  /** Search input, grows to fill the row — same toolbar row as the columns button, not a separate one above it. */
  toolbarLeft?: ReactNode;
  /** "Create" trigger (an icon button — see AdminFormDialog callers), rendered right next to the columns button. */
  toolbarRight?: ReactNode;
  /**
   * Pads the table out to this many rows with blank filler ones when it has
   * fewer — for a paginated table, its PAGE_SIZE (so the last, partial page
   * doesn't visibly shrink shorter than every other page); for an
   * unpaginated table, a fixed baseline so it doesn't look tiny/collapsed
   * with only a couple of rows. Acts as a floor when fillViewport is also
   * set (the larger of the two wins). Omit both to size the table purely by
   * its data.
   */
  minRows?: number;
  /**
   * Applied to every row's <tr> — real ones (merged with rowClassName) and
   * filler ones alike — so all rows are the same height regardless of how
   * much any individual row's content needs (e.g. a 1-line vs 2-line
   * secondary text column). A plain h-[Npx] utility, not min-h: table rows
   * don't honor min-height in the browser's row-height layout algorithm at
   * all (a real, verified table-layout quirk, not a hunch) — height does,
   * and per that same algorithm a row can still grow taller than it for
   * content that needs more room, so it isn't a clipping risk either.
   */
  rowHeightClassName?: string;
  /** Numeric px value matching rowHeightClassName — needed alongside it (not derived from it) only for fillViewport's arithmetic, since Tailwind can't generate CSS for a class built from a runtime template string. */
  rowHeightPx?: number;
  /**
   * Grows the filler-row count (on top of minRows, whichever is bigger)
   * to cover however much vertical space is actually free below the table
   * in the viewport — e.g. a short unfiltered list on a tall monitor no
   * longer leaves a dead gap between the table and the page's own bottom
   * padding. Client-measured (getBoundingClientRect + a resize listener),
   * so the extra rows appear a tick after the initial paint, and a table
   * whose real data already exceeds the viewport height simply gets zero
   * extra rows — no special-casing needed for that case.
   *
   * Only for unpaginated tables (ranks, roles, row-level-roles,
   * resource-roles, maps) — a PAGINATED table's row count per page is a
   * fixed, server-decided number (PAGE_SIZE, passed as minRows), so growing
   * past it here would show e.g. 8 real rows + 2 filler ones that look like
   * part of the page, only for the *next* page to start at row 9 anyway —
   * genuinely confusing, not just extra whitespace. Paginated callers
   * should pass minRows alone and leave this unset.
   */
  fillViewport?: boolean;
  /** Vertical space below the table to leave alone when fillViewport is measuring — just the page's own bottom padding for the unpaginated tables this is meant for. Default 140; pass viewportBottomReservePx explicitly if a given page's chrome below the table differs. */
  viewportBottomReservePx?: number;
}

const DEFAULT_VIEWPORT_BOTTOM_RESERVE_PX = 140;

/**
 * Convenience wrapper for the RSC/server-paginated admin tables: data is
 * always already fetched by the time this renders (no loading state to
 * account for), so this owns the empty state itself instead of leaving it
 * to the caller. Client-fetched tables (PagedTableLayout) use
 * DataTableHeader/DataTableBody directly instead, since they also need to
 * interleave a loading skeleton and an error state around the same table.
 */
export function DataTable<TData extends RowData>({
  columns, data, getRowId, rowClassName, sortColumn, sortDirection, onSort, emptyMessage, rowOffset, showRowNumber = true,
  toolbarLeft, toolbarRight, minRows, rowHeightClassName, rowHeightPx, fillViewport, viewportBottomReservePx,
}: DataTableProps<TData>) {
  const table = useDataTable(columns, data, getRowId, rowOffset, showRowNumber);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewportFillRows, setViewportFillRows] = useState(0);

  useEffect(() => {
    if (!fillViewport || !rowHeightPx) return;
    const el = wrapperRef.current;
    if (!el) return;

    const reserve = viewportBottomReservePx ?? DEFAULT_VIEWPORT_BOTTOM_RESERVE_PX;

    function recompute() {
      const top = el!.getBoundingClientRect().top;
      const available = window.innerHeight - top - reserve;
      const rowsThatFit = Math.max(0, Math.floor(available / rowHeightPx!));
      setViewportFillRows(Math.max(0, rowsThatFit - data.length));
    }

    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [fillViewport, rowHeightPx, viewportBottomReservePx, data.length]);

  const fillerCount = Math.max(
    minRows ? Math.max(0, minRows - data.length) : 0,
    viewportFillRows
  );

  return (
    <div ref={wrapperRef} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex-1 min-w-[160px]">{toolbarLeft}</div>
        <div className="flex items-center gap-2 shrink-0">
          {toolbarRight}
          <DataTableViewOptions table={table} />
        </div>
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
            <>
              <DataTableBody
                table={table}
                rowClassName={(row) => cn(rowHeightClassName, rowClassName?.(row))}
              />
              {/* Blank rows padding a short page (typically the last one) up
                  to the full page size — same cell padding/borders as real
                  rows (via each column's own meta), just empty content, so
                  the table's height stays constant across pages instead of
                  visibly shrinking and jumping the pagination footer up. */}
              {Array.from({ length: fillerCount }).map((_, i) => (
                <DocsTableRow key={`__filler-${i}`} aria-hidden="true" className={cn("pointer-events-none", rowHeightClassName)}>
                  {table.getVisibleLeafColumns().map((column) => {
                    const meta = column.columnDef.meta;
                    return (
                      <DocsTableCell
                        key={column.id}
                        className={meta?.cellClassName}
                        withRightBorder={meta?.withRightBorder}
                        style={{ width: column.getSize(), maxWidth: column.getSize() }}
                      >
                        {" "}
                      </DocsTableCell>
                    );
                  })}
                </DocsTableRow>
              ))}
            </>
          )}
        </DocsTableBody>
      </DocsTable>
    </div>
  );
}

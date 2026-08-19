import { type ReactNode } from "react";
import type { ColumnDef } from "@/components/ui/data-table";
import type { RowData } from "@tanstack/table-core";
import { cn } from "@/lib/utils";
import {
  DocsTable,
  DocsTableBody,
  DocsTableRow,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
import { useDataTable, DataTableColGroup, DataTableHeader, DataTableBody, DataTableViewOptions } from "@/components/ui/data-table";
import { TableSearch, TablePagination, TableSkeleton } from "@/components/docs/paged-table";

interface PagedTableLayoutProps<TData extends RowData> {
  className?: string;

  // Header props
  titleNode?: ReactNode;
  total?: number | null;
  totalIcon?: ReactNode;

  // Search props
  query: string;
  onQueryChange: (q: string) => void;
  searchPlaceholder?: string;

  // State
  isLoading: boolean;
  error?: string | null;
  isEmpty: boolean;
  emptyMessage?: ReactNode;

  // Table props
  skeletonWidths?: string[];
  skeletonRows?: number;
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  rowClassName?: (row: TData) => string | undefined;
  renderExtraRow?: (row: TData) => ReactNode;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string, defaultDirection?: "asc" | "desc") => void;
  /** Set false if `columns` already leads with its own rank/position column — see useDataTable. Default true. */
  showRowNumber?: boolean;

  // Pagination props
  page: number;
  totalPages: number;
  pageStart: number;
  pageSize: number;
  pageNumbers: () => (number | "…")[];
  goTo: (page: number) => void;
  showPagination?: boolean;
  /** Unique key to persist column sizing and visibility to localStorage. If omitted, state is lost on reload. */
  storageKey?: string;
}

export function PagedTableLayout<TData extends RowData>({
  className,
  titleNode,
  total,
  totalIcon,
  query,
  onQueryChange,
  searchPlaceholder,
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  skeletonWidths = ["w-40", "w-24", "w-16"],
  skeletonRows = 10,
  columns,
  data,
  getRowId,
  rowClassName,
  renderExtraRow,
  sortColumn,
  sortDirection,
  onSort,
  showRowNumber = true,
  page,
  totalPages,
  pageStart,
  pageSize,
  pageNumbers,
  goTo,
  showPagination = true,
  storageKey,
}: PagedTableLayoutProps<TData>) {
  const table = useDataTable(columns, data, getRowId, pageStart, showRowNumber, storageKey);

  // Skeleton cells must match the real column count, including the
  // automatic row-number column useDataTable prepends unless disabled (see
  // its doc comment) — callers' skeletonWidths only describe their own columns.
  const skeletonWidthsWithRowNumber = showRowNumber ? ["w-6", ...skeletonWidths] : skeletonWidths;
  const colSpan = skeletonWidthsWithRowNumber.length;

  return (
    <div className={cn("not-prose flex flex-col gap-3", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {titleNode}
          {total !== null && total !== undefined && (
            <div className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {totalIcon}
              {total}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TableSearch
            className="flex-1 min-w-[160px] sm:flex-initial"
            value={query}
            onChange={onQueryChange}
            placeholder={searchPlaceholder ?? "Найти"}
          />
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Table */}
      <DocsTable wrapperClassName="min-w-0 min-h-0" className="table-fixed w-full" style={{ minWidth: table.getTotalSize() }}>
        <DataTableColGroup table={table} />
        <DataTableHeader table={table} sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />

        <DocsTableBody className="[&_tr:last-child]:border-0">
          {isLoading && <TableSkeleton rows={skeletonRows} cellWidths={skeletonWidthsWithRowNumber} />}

          {!!error && (
            <DocsTableRow>
              <DocsTableCell colSpan={colSpan} className="text-center py-10">
                <p className="text-sm text-red-600/70 dark:text-red-400/70">{error}</p>
              </DocsTableCell>
            </DocsTableRow>
          )}

          {!isLoading && !error && isEmpty && (
            <DocsTableRow>
              <DocsTableCell colSpan={colSpan} className="text-center py-10">
                <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>
                  {emptyMessage ?? "Ничего не найдено"}
                </p>
              </DocsTableCell>
            </DocsTableRow>
          )}

          {!isLoading && !error && !isEmpty && (
            <DataTableBody table={table} rowClassName={rowClassName} renderExtraRow={renderExtraRow} />
          )}
        </DocsTableBody>
      </DocsTable>

      {/* Footer */}
      {showPagination && total !== null && total !== undefined && total > 0 && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          pageStart={pageStart}
          pageSize={pageSize}
          total={total}
          pageNumbers={pageNumbers}
          goTo={goTo}
        />
      )}
    </div>
  );
}

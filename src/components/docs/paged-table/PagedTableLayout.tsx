import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  DocsTable,
  DocsTableBody,
  DocsTableRow,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
import { TableSearch, TablePagination, TableSkeleton } from "@/components/docs/paged-table";

interface PagedTableLayoutProps {
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
  tableHeader: ReactNode;
  children: ReactNode; // The actual rows

  // Pagination props
  page: number;
  totalPages: number;
  pageStart: number;
  pageSize: number;
  pageNumbers: () => (number | "…")[];
  goTo: (page: number) => void;
  showPagination?: boolean;
}

export function PagedTableLayout({
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
  tableHeader,
  children,
  page,
  totalPages,
  pageStart,
  pageSize,
  pageNumbers,
  goTo,
  showPagination = true,
}: PagedTableLayoutProps) {
  // We need to count the columns from the skeletonWidths to span the empty/error states correctly
  const colSpan = skeletonWidths.length;

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

        <TableSearch
          value={query}
          onChange={onQueryChange}
          placeholder={searchPlaceholder ?? "Поиск…"}
        />
      </div>

      {/* Table */}
      <DocsTable>
        {tableHeader}

        <DocsTableBody className="[&_tr:last-child]:border-0">
          {isLoading && <TableSkeleton rows={skeletonRows} cellWidths={skeletonWidths} />}

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

          {!isLoading && !error && !isEmpty && children}
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

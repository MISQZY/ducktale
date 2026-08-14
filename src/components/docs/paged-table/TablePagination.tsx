"use client";

import { cn } from "@/lib/utils";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TablePaginationProps {
  page:        number;
  totalPages:  number;
  pageStart:   number;
  pageSize:    number;
  total:       number;
  pageNumbers: () => (number | "…")[];
  goTo:        (page: number) => void;
}

export function TablePagination({
  page, totalPages, pageStart, pageSize, total, pageNumbers, goTo,
}: TablePaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <span className={cn("text-xs tabular-nums shrink-0", DOCS_TABLE_THEME.textFaint)}>
        {pageStart + 1}–{Math.min(pageStart + pageSize, total)} из {total}
      </span>

      {totalPages > 1 && (
        <Pagination className="justify-end w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); goTo(page - 1); }}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
                text=""
              />
            </PaginationItem>

            {pageNumbers().map((p, i) => (
              <PaginationItem key={p === "…" ? `ellipsis-${i}` : p}>
                {p === "…" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); goTo(p as number); }}
                    isActive={p === page}
                  >
                    {p}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); goTo(page + 1); }}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                text=""
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

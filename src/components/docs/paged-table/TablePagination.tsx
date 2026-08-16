"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";
import { computePageNumbers } from "@/lib/pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Href = ComponentProps<typeof Link>["href"];

interface TablePaginationProps {
  page:        number;
  totalPages:  number;
  pageStart:   number;
  pageSize:    number;
  total:       number;
  /**
   * Page-number list ([1, "…", 4, 5, 6, "…", 12]) — usePagedTable already
   * computes this for its client callers. Omit to have this component
   * compute it itself from page/totalPages (what hrefBase/server callers
   * do — they can't pass a function prop across the Server->Client
   * Component boundary, only plain serializable data).
   */
  pageNumbers?: () => (number | "…")[];
  /** Client-fetched tables (usePagedTable) — updates local state, no navigation. Give this OR hrefBase, never both. */
  goTo?: (page: number) => void;
  /**
   * Server-rendered tables (admin's RSC pages, paginated via searchParams)
   * — real links instead of client state, so pages work without JS and are
   * shareable/bookmarkable. Plain serializable data (not a hrefFor
   * callback) for the same reason pageNumbers is optional above — a
   * Server Component caller can't hand this Client Component a function.
   * "page" is merged into `query` per link, overriding any page key
   * already in it.
   */
  hrefBase?: { pathname: string; query?: Record<string, string> };
}

function PageArrow({
  direction, disabled, href, className,
}: {
  direction: "prev" | "next";
  disabled:  boolean;
  href:      Href;
  className: string;
}) {
  const Icon = direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  const label = direction === "prev" ? "Go to previous page" : "Go to next page";

  if (disabled) {
    return (
      <span aria-hidden="true" className={cn(className, "pointer-events-none opacity-50")}>
        <Icon />
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      <Icon />
    </Link>
  );
}

export function TablePagination({
  page, totalPages, pageStart, pageSize, total, pageNumbers, goTo, hrefBase,
}: TablePaginationProps) {
  if (total === 0) return null;

  const numbers = pageNumbers ? pageNumbers() : computePageNumbers(page, totalPages);
  const hrefFor = hrefBase
    ? (p: number): Href => ({ pathname: hrefBase.pathname, query: { ...hrefBase.query, page: String(p) } })
    : undefined;

  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <span className={cn("text-xs tabular-nums shrink-0", DOCS_TABLE_THEME.textFaint)}>
        {pageStart + 1}–{Math.min(pageStart + pageSize, total)} из {total}
      </span>

      {totalPages > 1 && (
        <Pagination className="justify-end w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              {hrefFor ? (
                <PageArrow
                  direction="prev"
                  disabled={page === 1}
                  href={hrefFor(page - 1)}
                  className={cn(buttonVariants({ variant: "ghost", size: "default" }), "pl-1.5!")}
                />
              ) : (
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); goTo?.(page - 1); }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                  text=""
                />
              )}
            </PaginationItem>

            {numbers.map((p, i) => (
              <PaginationItem key={p === "…" ? `ellipsis-${i}` : p}>
                {p === "…" ? (
                  <PaginationEllipsis />
                ) : hrefFor ? (
                  <Link
                    href={hrefFor(p as number)}
                    aria-current={p === page ? "page" : undefined}
                    className={buttonVariants({ variant: p === page ? "outline" : "ghost", size: "icon" })}
                  >
                    {p}
                  </Link>
                ) : (
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); goTo?.(p as number); }}
                    isActive={p === page}
                  >
                    {p}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              {hrefFor ? (
                <PageArrow
                  direction="next"
                  disabled={page === totalPages}
                  href={hrefFor(page + 1)}
                  className={cn(buttonVariants({ variant: "ghost", size: "default" }), "pr-1.5!")}
                />
              ) : (
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); goTo?.(page + 1); }}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                  text=""
                />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

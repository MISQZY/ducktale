"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";

interface PageButtonProps {
  onClick:   () => void;
  disabled?: boolean;
  active?:   boolean;
  children:  React.ReactNode;
}

function PageButton({ onClick, disabled, active, children }: PageButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded text-xs font-mono transition-colors",
        active
          ? "bg-[#BFA246]/20 text-[#FFE289] border border-[#BFA246]/40"
          : "text-[#BFA246]/55 border border-transparent hover:border-[#BFA246]/20 hover:text-[#FFE289]/80",
        disabled && "pointer-events-none opacity-30",
      )}
    >
      {children}
    </button>
  );
}

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
    <div className="flex items-center justify-between gap-4">
      <span className={cn("text-xs tabular-nums", DOCS_TABLE_THEME.textFaint)}>
        {pageStart + 1}–{Math.min(pageStart + pageSize, total)} из {total}
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-0.5">
          <PageButton onClick={() => goTo(page - 1)} disabled={page === 1}>
            <ChevronLeft size={13} />
          </PageButton>

          {pageNumbers().map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className={cn("px-1 text-xs", DOCS_TABLE_THEME.textFaint)}>…</span>
            ) : (
              <PageButton key={p} onClick={() => goTo(p as number)} active={p === page}>{p}</PageButton>
            ),
          )}

          <PageButton onClick={() => goTo(page + 1)} disabled={page === totalPages}>
            <ChevronRight size={13} />
          </PageButton>
        </div>
      )}
    </div>
  );
}
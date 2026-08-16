"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface UseAdaptivePageSizeOptions {
  /** The page's actual current row count (its PAGE_SIZE, from ?pageSize= or the server default). */
  currentPageSize: number;
  /** Fixed row height (px) every admin table renders at — see DataTable's rowHeightClassName/rowHeightPx. */
  rowHeightPx: number;
  minPageSize?: number;
  maxPageSize?: number;
  /** Vertical space below the table to leave alone — the page's bottom padding plus its TablePagination bar and margin. */
  bottomReservePx?: number;
}

/**
 * Grows (or shrinks) a paginated admin table's actual PAGE_SIZE to fill the
 * viewport with real rows, instead of DataTable's fillViewport padding the
 * gap with blank ones — that looked like extra rows belonging to the page,
 * only for the next page to start fresh anyway (see the git history on
 * data-table.tsx's fillViewport doc comment for why that's reserved for
 * unpaginated tables specifically).
 *
 * Attach the returned ref to the table's wrapper. On mount and on resize,
 * measures how many rowHeightPx rows actually fit below that point and, if
 * that differs from currentPageSize, rewrites ?pageSize= (preserving every
 * other query param via URLSearchParams) and drops ?page= — a page number
 * computed against the old page size no longer points at the same rows —
 * via router.replace, which re-fetches this RSC page with the corrected
 * take/skip. First paint still uses the server-side default page size
 * (there's no viewport size at request time); this settles it a tick after
 * hydration, same one-time-correction shape as useAdminTableSort's URL sync.
 */
export function useAdaptivePageSize({
  currentPageSize, rowHeightPx, minPageSize = 5, maxPageSize = 30, bottomReservePx = 140,
}: UseAdaptivePageSizeOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function recompute() {
      const top = el!.getBoundingClientRect().top;
      const available = window.innerHeight - top - bottomReservePx;
      const ideal = Math.min(maxPageSize, Math.max(minPageSize, Math.floor(available / rowHeightPx)));
      if (ideal === currentPageSize) return;

      const params = new URLSearchParams(searchParams);
      params.set("pageSize", String(ideal));
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }

    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [currentPageSize, rowHeightPx, minPageSize, maxPageSize, bottomReservePx, pathname, router, searchParams]);

  return ref;
}

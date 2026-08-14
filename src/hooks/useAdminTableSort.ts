"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * onSort handler for the admin tables (Users/Tickets/Badges/Roles) — these
 * are plain RSC pages navigated via router.push, not client-fetched like
 * the leaderboard/docs tables (see usePagedTable's own URL-sync comment for
 * why *that* hook avoids the router). The *current* sortColumn/sortDirection
 * aren't read here — the page already parses sort/order out of its own
 * searchParams for the Prisma query, so it passes them down as props
 * instead of this hook re-deriving them from the URL a second time. Same
 * click cycle as usePagedTable.setSort: defaultDirection -> the other
 * direction -> cleared, and every sort change resets to page 1.
 */
export function useAdminTableSort(sortColumn: string | undefined, sortDirection: "asc" | "desc" | undefined) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSort = useCallback((column: string, defaultDirection: "asc" | "desc" = "desc") => {
    let newDir: "asc" | "desc" | undefined = defaultDirection;
    if (sortColumn === column) {
      newDir = sortDirection === defaultDirection ? (defaultDirection === "desc" ? "asc" : "desc") : undefined;
    }

    const params = new URLSearchParams(searchParams);
    if (newDir) {
      params.set("sort", column);
      params.set("order", newDir);
    } else {
      params.delete("sort");
      params.delete("order");
    }
    params.delete("page");

    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }, [router, pathname, searchParams, sortColumn, sortDirection]);

  return onSort;
}

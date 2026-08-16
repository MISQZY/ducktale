/**
 * Parses and clamps a `?pageSize=` search param — used by the admin pages
 * that support useAdaptivePageSize (src/hooks/useAdaptivePageSize.ts), which
 * rewrites that param client-side to whatever row count actually fills the
 * viewport. The clamp exists because it's user-editable request input: a
 * huge value would mean an oversized `take` on the underlying query.
 */
export function resolvePageSize(raw: string | undefined, defaultSize: number, min = 5, max = 30): number {
  const parsed = parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return defaultSize;
  return Math.min(max, Math.max(min, parsed));
}

/**
 * Page numbers to render for a pager, with "…" gaps once there are too many
 * to list in full — e.g. [1, "…", 4, 5, 6, "…", 12]. Shared by
 * usePagedTable.ts (client-fetched tables) and every admin listing page
 * (server-rendered, paginated via searchParams) so both land on the exact
 * same TablePagination component with identical page-window behavior.
 */
export function computePageNumbers(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  const left  = Math.max(2, page - 1);
  const right = Math.min(totalPages - 1, page + 1);
  if (left > 2)               pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

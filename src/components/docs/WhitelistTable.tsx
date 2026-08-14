"use client";

import { useCallback, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Users, Infinity as InfinityIcon } from "lucide-react";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";
import {
  HighlightMatch,
  PagedTableLayout,
} from "@/components/docs/paged-table";
import { usePagedTable } from "@/hooks/usePagedTable";
import type { WhitelistPlayer, WhitelistResponse } from "@/types/whitelist";

// ─── Re-export types so consumers import from one place ────────────────────────
export type { WhitelistPlayer, WhitelistResponse };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit", month: "2-digit", year: "numeric",
});

function formatDate(ms: number): string {
  return ms ? DATE_FMT.format(new Date(ms)) : "—";
}

function isExpired(expiresAt: number): boolean {
  return expiresAt > 0 && expiresAt < Date.now();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SKELETON_WIDTHS = ["w-6", "w-28", "w-20", "w-16", "w-16"];

function ExpiryCell({ expiresAt }: { expiresAt: number }) {
  if (expiresAt === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600/70 dark:text-emerald-400/70">
        <InfinityIcon size={12} />
        навсегда
      </span>
    );
  }
  return (
    <span className={cn(
      "text-xs tabular-nums",
      isExpired(expiresAt) ? "text-red-600/60 dark:text-red-400/60 line-through" : "text-foreground/70",
    )}>
      {formatDate(expiresAt)}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WhitelistTableProps {
  title?:     string;
  /** Internal FlectonePulse server UUID. When omitted, returns all servers. */
  serverId?:  string;
  pageSize?:  number;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WhitelistTable({
  title,
  serverId,
  pageSize = 10,
  className,
}: WhitelistTableProps) {

  // Build a stable fetcher that maps the API response to the generic PagedResponse<T> shape.
  const fetcher = useCallback(async (page: number, query: string, sort?: string, order?: string) => {
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      ...(serverId ? { serverId } : {}),
      ...(query ? { search: query } : {}),
      ...(sort ? { sort } : {}),
      ...(order ? { order } : {}),
    });
    const r = await fetch(`/api/whitelist?${params}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const res: WhitelistResponse = await r.json();
    // Normalise to the generic PagedResponse<WhitelistPlayer> shape.
    return { ...res, items: res.players };
  }, [pageSize, serverId]);

  const {
    state, query, page, data,
    sortColumn, sortDirection,
    isLoading, isRefreshing,
    pageStart, totalPages,
    pageNumbers, setQuery, setSort, goTo,
  } = usePagedTable<WhitelistPlayer>({ fetcher });

  const total = data?.total ?? null;

  const columns = useMemo<ColumnDef<WhitelistPlayer, unknown>[]>(() => [
    {
      id: "name",
      header: "Игрок",
      size: 220,
      minSize: 120,
      enableHiding: false,
      meta: { withRightBorder: true, sortKey: "name" },
      cell: ({ row }) => <HighlightMatch text={row.original.name} query={query} />,
    },
    {
      id: "moderator",
      header: "Добавил",
      size: 120,
      minSize: 80,
      meta: { withRightBorder: true, sortKey: "moderator" },
      cell: ({ row }) => (
        <span className={cn("text-xs font-medium", DOCS_TABLE_THEME.textSoft)}>
          {row.original.moderator}
        </span>
      ),
    },
    {
      id: "addedAt",
      header: "Добавлен",
      size: 120,
      minSize: 90,
      meta: { withRightBorder: true, sortKey: "addedAt" },
      cell: ({ row }) => (
        <span className={cn("text-xs tabular-nums", DOCS_TABLE_THEME.textFaint)}>
          {formatDate(row.original.addedAt)}
        </span>
      ),
    },
    {
      id: "expiresAt",
      header: "Действителен до",
      size: 140,
      minSize: 100,
      meta: { sortKey: "expiresAt" },
      cell: ({ row }) => <ExpiryCell expiresAt={row.original.expiresAt} />,
    },
  ], [query]);

  return (
    <PagedTableLayout
      className={className}
      titleNode={
        <span
          className="text-sm font-semibold text-foreground/80 tracking-wide"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {title ?? "Вайтлист"}
        </span>
      }
      total={total}
      totalIcon={<Users size={10} />}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Найти"
      isLoading={isLoading}
      error={state.status === "error" ? `Не удалось загрузить список: ${state.message}` : null}
      isEmpty={!!data && data.items.length === 0}
      emptyMessage={query ? `Игрок «${query}» не найден` : "Вайтлист пуст"}
      skeletonWidths={SKELETON_WIDTHS}
      page={page}
      totalPages={totalPages}
      pageStart={pageStart}
      pageSize={pageSize}
      pageNumbers={pageNumbers}
      goTo={goTo}
      columns={columns}
      data={data?.items ?? []}
      getRowId={(player) => String(player.id)}
      rowClassName={() => cn(isRefreshing && "opacity-40 transition-opacity")}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={setSort}
    />
  );
}

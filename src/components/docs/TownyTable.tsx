"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Landmark } from "lucide-react";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";
import {
  PagedTableLayout,
} from "@/components/docs/paged-table";
import { usePagedTable } from "@/hooks/usePagedTable";
import { httpErrorKey } from "@/lib/http-error-message";
import { TownNameCell, TownNationBadge } from "@/components/towny/TownCells";
import type { Town, TownyResponse } from "@/types/towny";

// ─── Re-export types so consumers import from one place ────────────────────────
export type { Town, TownyResponse };

const SKELETON_WIDTHS = ["w-40", "w-24", "w-16"];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TownyTableProps {
  title?:     string;
  pageSize?:  number;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TownyTable({
  title,
  pageSize = 10,
  className,
}: TownyTableProps) {
  const tCommon = useTranslations("Common");

  // Build a stable fetcher that maps the API response to the generic PagedResponse<T> shape.
  const fetcher = useCallback(async (page: number, query: string, sort?: string, order?: string) => {
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      ...(query ? { search: query } : {}),
      ...(sort ? { sort } : {}),
      ...(order ? { order } : {}),
    });
    let r: Response;
    try {
      r = await fetch(`/api/towns?${params}`);
    } catch {
      throw new Error(tCommon(httpErrorKey(0)));
    }
    if (!r.ok) throw new Error(tCommon(httpErrorKey(r.status)));
    const res: TownyResponse = await r.json();
    // Normalise to the generic PagedResponse<Town> shape.
    return { ...res, items: res.towns };
  }, [pageSize, tCommon]);

  const {
    state, query, page, data,
    sortColumn, sortDirection,
    isLoading, isRefreshing,
    pageStart, totalPages,
    pageNumbers, setQuery, setSort, goTo,
  } = usePagedTable<Town>({ fetcher });

  const total = data?.total ?? null;

  const columns = useMemo<ColumnDef<Town, unknown>[]>(() => [
    {
      id: "town",
      header: "Город",
      size: 280,
      minSize: 160,
      enableHiding: false,
      meta: { withRightBorder: true, sortKey: "town" },
      cell: ({ row }) => (
        <TownNameCell tag={row.original.tag} name={row.original.name} query={query} residents={row.original.residents} />
      ),
    },
    {
      id: "nation",
      header: "Нация",
      size: 160,
      minSize: 100,
      meta: { withRightBorder: true, sortKey: "nation" },
      cell: ({ row }) => (
        <TownNationBadge nation={row.original.nation} nationTag={row.original.nationTag} independentLabel="Независимый" />
      ),
    },
    {
      id: "size",
      header: "Размер",
      size: 110,
      minSize: 80,
      meta: { sortKey: "size" },
      cell: ({ row }) => (
        <span className={cn("text-xs font-mono tabular-nums", DOCS_TABLE_THEME.textSoft)}>
          {row.original.size}
        </span>
      ),
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
          {title ?? "Города"}
        </span>
      }
      total={total}
      totalIcon={<Landmark size={10} />}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Найти"
      isLoading={isLoading}
      error={state.status === "error" ? state.message : null}
      isEmpty={!!data && data.items.length === 0}
      emptyMessage={query ? `Город «${query}» не найден` : "Городов пока нет"}
      skeletonWidths={SKELETON_WIDTHS}
      page={page}
      totalPages={totalPages}
      pageStart={pageStart}
      pageSize={pageSize}
      pageNumbers={pageNumbers}
      goTo={goTo}
      columns={columns}
      data={data?.items ?? []}
      getRowId={(town) => town.name}
      rowClassName={() => cn("h-[76px]", isRefreshing && "opacity-40 transition-opacity")}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={setSort}
    />
  );
}

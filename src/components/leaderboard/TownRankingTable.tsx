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
import { TownNameLabel, TownNationBadge } from "@/components/towny/TownCells";
import { RankBadge } from "./RankBadge";
import type { RankedTown, TownRankingResponse } from "@/types/town-ranking";

export type { RankedTown, TownRankingResponse };

const SKELETON_WIDTHS = ["w-8", "w-32", "w-20", "w-16"];

export interface TownRankingTableProps {
  pageSize?:  number;
  className?: string;
}

export function TownRankingTable({ pageSize = 15, className }: TownRankingTableProps) {
  const t = useTranslations("Leaderboard");
  const tCommon = useTranslations("Common");

  const fetcher = useCallback(async (page: number, query: string, sort?: string, order?: string) => {
    const params = new URLSearchParams({
      type:     "towns",
      page:     String(page),
      pageSize: String(pageSize),
      ...(query ? { search: query } : {}),
      ...(sort ? { sort } : {}),
      ...(order ? { order } : {}),
    });
    let r: Response;
    try {
      r = await fetch(`/api/leaderboard?${params}`);
    } catch {
      throw new Error(tCommon(httpErrorKey(0)));
    }
    if (!r.ok) throw new Error(tCommon(httpErrorKey(r.status)));
    const res: TownRankingResponse = await r.json();
    return { ...res, items: res.towns };
  }, [pageSize, tCommon]);

  const {
    state, query, page, data,
    sortColumn, sortDirection,
    isLoading, isRefreshing,
    pageStart, totalPages,
    pageNumbers, setQuery, setSort, goTo,
  } = usePagedTable<RankedTown>({ fetcher });

  const total = data?.total ?? null;

  const columns = useMemo<ColumnDef<RankedTown, unknown>[]>(() => [
    {
      id: "rank",
      header: t("columns.rank"),
      size: 60,
      minSize: 48,
      enableHiding: false,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", withRightBorder: true, sortKey: "rank", defaultSortDirection: "asc" },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <RankBadge rank={row.original.rank} size={18} medalScale={1.35} variant="text" />
        </div>
      ),
    },
    {
      id: "town",
      header: t("columns.town"),
      size: 260,
      minSize: 140,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "town", defaultSortDirection: "asc" },
      cell: ({ row }) => <TownNameLabel tag={row.original.tag} name={row.original.name} query={query} />,
    },
    {
      id: "nation",
      header: t("columns.nation"),
      size: 130,
      minSize: 90,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "nation", defaultSortDirection: "asc" },
      cell: ({ row }) => (
        <TownNationBadge nation={row.original.nation} nationTag={row.original.nationTag} independentLabel={t("townIndependent")} />
      ),
    },
    {
      id: "size",
      header: t("columns.size"),
      size: 100,
      minSize: 72,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", sortKey: "size", defaultSortDirection: "desc" },
      cell: ({ row }) => (
        <span className={cn("text-xs font-mono tabular-nums", DOCS_TABLE_THEME.textSoft)}>
          {row.original.size}
        </span>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [query]);

  return (
    <PagedTableLayout
      className={className}
      titleNode={
        <span
          className="text-sm font-semibold text-foreground/80 tracking-wide"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("townsTitle")}
        </span>
      }
      total={total}
      totalIcon={<Landmark size={10} />}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder={t("townsSearchPlaceholder")}
      isLoading={isLoading}
      error={state.status === "error" ? state.message : null}
      isEmpty={!!data && data.items.length === 0}
      emptyMessage={query ? t("townsNotFound", { query }) : t("townsEmpty")}
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
      showRowNumber={false}
      rowClassName={(town) =>
        cn(
          town.rank <= 10 && "bg-amber-500/[0.06] border-l-2 border-l-amber-500/50",
          isRefreshing && "opacity-40 transition-opacity"
        )
      }
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={setSort}
    />
  );
}

"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Landmark } from "lucide-react";
import {
  DocsTableHeader,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
import {
  PagedTableLayout,
} from "@/components/docs/paged-table";
import { usePagedTable } from "@/hooks/usePagedTable";
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

  const fetcher = useCallback(async (page: number, query: string, sort?: string, order?: string) => {
    const params = new URLSearchParams({
      type:     "towns",
      page:     String(page),
      pageSize: String(pageSize),
      ...(query ? { search: query } : {}),
      ...(sort ? { sort } : {}),
      ...(order ? { order } : {}),
    });
    const r = await fetch(`/api/leaderboard?${params}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const res: TownRankingResponse = await r.json();
    return { ...res, items: res.towns };
  }, [pageSize]);

  const {
    state, query, page, data,
    sortColumn, sortDirection,
    isLoading, isRefreshing,
    pageStart, totalPages,
    pageNumbers, setQuery, setSort, goTo,
  } = usePagedTable<RankedTown>({ fetcher });

  const total = data?.total ?? null;

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
      error={state.status === "error" ? t("loadError", { message: state.message }) : null}
      isEmpty={!!data && data.items.length === 0}
      emptyMessage={query ? t("townsNotFound", { query }) : t("townsEmpty")}
      skeletonWidths={SKELETON_WIDTHS}
      page={page}
      totalPages={totalPages}
      pageStart={pageStart}
      pageSize={pageSize}
      pageNumbers={pageNumbers}
      goTo={goTo}
      tableHeader={
        <DocsTableHeader>
          <DocsTableRow>
            <DocsTableHead sortable sortDirection={sortColumn === "rank" ? sortDirection : undefined} onSort={() => setSort("rank", "asc")} className="w-14 text-center align-middle" withRightBorder>{t("columns.rank")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "town" ? sortDirection : undefined} onSort={() => setSort("town", "asc")} className="align-middle"                  withRightBorder>{t("columns.town")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "nation" ? sortDirection : undefined} onSort={() => setSort("nation", "asc")} className="w-32 align-middle" withRightBorder>{t("columns.nation")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "size" ? sortDirection : undefined} onSort={() => setSort("size", "desc")} className="w-24 text-center align-middle"               >{t("columns.size")}</DocsTableHead>
          </DocsTableRow>
        </DocsTableHeader>
      }
    >
      {data && data.items.map((town) => {
        const isTopTen = town.rank <= 10;
        return (
          <DocsTableRow
            key={town.name}
            className={cn(
              isTopTen && "bg-amber-500/[0.06] border-l-2 border-l-amber-500/50",
              isRefreshing && "opacity-40 transition-opacity"
            )}
          >
            <DocsTableCell className="text-center align-middle" withRightBorder>
              <div className="flex justify-center">
                <RankBadge rank={town.rank} size={18} medalScale={1.35} variant="text" />
              </div>
            </DocsTableCell>

            <DocsTableCell className="align-middle" withRightBorder>
              <TownNameLabel tag={town.tag} name={town.name} query={query} />
            </DocsTableCell>

            <DocsTableCell className="align-middle" withRightBorder>
              <TownNationBadge nation={town.nation} nationTag={town.nationTag} independentLabel={t("townIndependent")} />
            </DocsTableCell>

            <DocsTableCell className="text-center align-middle">
              <span className={cn("text-xs font-mono tabular-nums", DOCS_TABLE_THEME.textSoft)}>
                {town.size}
              </span>
            </DocsTableCell>
          </DocsTableRow>
        );
      })}
    </PagedTableLayout>
  );
}

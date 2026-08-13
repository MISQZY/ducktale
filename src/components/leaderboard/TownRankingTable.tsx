"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Castle, Landmark } from "lucide-react";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
import { DuckBadge } from "@/components/ui/duck/badge";
import {
  TableSearch,
  TablePagination,
  TableSkeleton,
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
      page:     String(page),
      pageSize: String(pageSize),
      ...(query ? { search: query } : {}),
      ...(sort ? { sort } : {}),
      ...(order ? { order } : {}),
    });
    const r = await fetch(`/api/leaderboard/towns?${params}`);
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
    <div className={cn("not-prose flex flex-col gap-3", className)}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Castle size={15} className="text-primary/80 shrink-0" />
          <span
            className="text-sm font-semibold text-foreground/80 tracking-wide"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("townsTitle")}
          </span>
          {total !== null && (
            <DuckBadge variant="outline" className="gap-1 border-primary/35 text-primary bg-primary/10">
              <Landmark size={10} />
              {total}
            </DuckBadge>
          )}
        </div>

        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder={t("townsSearchPlaceholder")}
        />
      </div>

      {/* Table */}
      <DocsTable>
        <DocsTableHeader>
          <DocsTableRow>
            <DocsTableHead sortable sortDirection={sortColumn === "rank" ? sortDirection : undefined} onSort={() => setSort("rank", "asc")} className="w-14 text-center align-middle" withRightBorder>{t("columns.rank")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "town" ? sortDirection : undefined} onSort={() => setSort("town", "asc")} className="align-middle"                  withRightBorder>{t("columns.town")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "nation" ? sortDirection : undefined} onSort={() => setSort("nation", "asc")} className="w-32 align-middle" withRightBorder>{t("columns.nation")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "size" ? sortDirection : undefined} onSort={() => setSort("size", "desc")} className="w-24 text-center align-middle"               >{t("columns.size")}</DocsTableHead>
          </DocsTableRow>
        </DocsTableHeader>

        <DocsTableBody className="[&_tr:last-child]:border-0">
          {isLoading && <TableSkeleton rows={pageSize} cellWidths={SKELETON_WIDTHS} />}

          {state.status === "error" && (
            <DocsTableRow>
              <DocsTableCell colSpan={4} className="text-center py-10">
                <p className="text-sm text-red-600/70 dark:text-red-400/70">{t("loadError", { message: state.message })}</p>
              </DocsTableCell>
            </DocsTableRow>
          )}

          {data && !isLoading && data.items.length === 0 && (
            <DocsTableRow>
              <DocsTableCell colSpan={4} className="text-center py-10">
                <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>
                  {query ? t("townsNotFound", { query }) : t("townsEmpty")}
                </p>
              </DocsTableCell>
            </DocsTableRow>
          )}

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
                    <RankBadge rank={town.rank} size={18} variant="text" />
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
        </DocsTableBody>
      </DocsTable>

      {/* Footer */}
      {data && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          pageStart={pageStart}
          pageSize={pageSize}
          total={data.total}
          pageNumbers={pageNumbers}
          goTo={goTo}
        />
      )}
    </div>
  );
}

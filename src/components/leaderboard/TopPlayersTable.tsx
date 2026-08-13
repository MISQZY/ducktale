"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Trophy, Users } from "lucide-react";
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
  HighlightMatch,
} from "@/components/docs/paged-table";
import { usePagedTable } from "@/hooks/usePagedTable";
import { formatDurationMs } from "@/lib/player-card-format";
import { RankBadge } from "./RankBadge";
import { CompactBadgeChip } from "@/components/badges/CompactBadgeChip";
import { SkinFace } from "@/components/common/SkinFace";
import { PlayerChip } from "@/components/common/PlayerChip";
import type { LeaderboardPlayer, LeaderboardResponse } from "@/types/leaderboard";

export type { LeaderboardPlayer, LeaderboardResponse };

const SKELETON_WIDTHS = ["w-8", "w-32", "w-20"];
const MAX_VISIBLE_BADGES = 3;

export interface TopPlayersTableProps {
  pageSize?:  number;
  className?: string;
}

export function TopPlayersTable({ pageSize = 10, className }: TopPlayersTableProps) {
  const t = useTranslations("Leaderboard");
  const tCard = useTranslations("PlayerCard");

  const fetcher = useCallback(async (page: number, query: string, sort?: string, order?: string) => {
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      ...(query ? { search: query } : {}),
      ...(sort ? { sort } : {}),
      ...(order ? { order } : {}),
    });
    const r = await fetch(`/api/leaderboard?${params}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const res: LeaderboardResponse = await r.json();
    return { ...res, items: res.players };
  }, [pageSize]);

  const {
    state, query, page, data,
    sortColumn, sortDirection,
    isLoading, isRefreshing,
    pageStart, totalPages,
    pageNumbers, setQuery, setSort, goTo,
  } = usePagedTable<LeaderboardPlayer>({ fetcher });

  const total = data?.total ?? null;

  return (
    <div className={cn("not-prose flex flex-col gap-3", className)}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-amber-500/80 shrink-0" />
          <span
            className="text-sm font-semibold text-foreground/80 tracking-wide"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("title")}
          </span>
          {total !== null && (
            <DuckBadge variant="outline" className="gap-1 border-amber-700/35 text-amber-700 dark:text-amber-300/80 bg-amber-950/20">
              <Users size={10} />
              {total}
            </DuckBadge>
          )}
        </div>

        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder={t("searchPlaceholder")}
        />
      </div>

      {/* Table */}
      <div className="relative z-10">
        <DocsTable>
          <DocsTableHeader>
            <DocsTableRow>
              <DocsTableHead sortable sortDirection={sortColumn === "rank" ? sortDirection : undefined} onSort={() => setSort("rank", "asc")} className="w-16 text-center align-middle" withRightBorder>{t("columns.rank")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "player" ? sortDirection : undefined} onSort={() => setSort("player", "asc")} className="align-middle"                  withRightBorder>{t("columns.player")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "playtime" ? sortDirection : undefined} onSort={() => setSort("playtime", "desc")} className="w-40 text-center align-middle"               >{t("columns.playtime")}</DocsTableHead>
            </DocsTableRow>
          </DocsTableHeader>

        <DocsTableBody className="[&_tr:last-child]:border-b-0">
          {isLoading && <TableSkeleton rows={pageSize} cellWidths={SKELETON_WIDTHS} />}

          {state.status === "error" && (
            <DocsTableRow>
              <DocsTableCell colSpan={3} className="text-center py-10">
                <p className="text-sm text-red-600/70 dark:text-red-400/70">{t("loadError", { message: state.message })}</p>
              </DocsTableCell>
            </DocsTableRow>
          )}

          {data && !isLoading && data.items.length === 0 && (
            <DocsTableRow>
              <DocsTableCell colSpan={3} className="text-center py-10">
                <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>
                  {query ? t("notFound", { query }) : t("empty")}
                </p>
              </DocsTableCell>
            </DocsTableRow>
          )}

          {data && data.items.map((player) => {
            const isTopTen = player.rank <= 10;
            return (
              <DocsTableRow
                key={player.uuid}
                className={cn(
                  isTopTen && "bg-amber-500/[0.06] !border-l-2 border-l-amber-500/50",
                  isRefreshing && "opacity-40 transition-opacity"
                )}
              >
                <DocsTableCell className="text-center align-middle">
                  <div className="flex justify-center">
                    <RankBadge rank={player.rank} size={18} variant="text" />
                  </div>
                </DocsTableCell>

                <DocsTableCell className="align-middle">
                  <PlayerChip
                    name={player.name}
                    profileUsername={player.profileUsername}
                    skinUrl={player.skinUrl}
                    online={player.online}
                    badges={player.badges}
                    query={query}
                  />
                </DocsTableCell>

                <DocsTableCell className="text-center align-middle">
                  <span className={cn("text-xs tabular-nums", DOCS_TABLE_THEME.textSoft)}>
                    {formatDurationMs(player.playtimeMs, tCard)}
                  </span>
                </DocsTableCell>
              </DocsTableRow>
            );
          })}
        </DocsTableBody>
      </DocsTable>
      </div>

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

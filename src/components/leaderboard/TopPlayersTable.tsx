"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import {
  DocsTableHeader,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
import {
  PagedTableLayout,
  HighlightMatch,
} from "@/components/docs/paged-table";
import { usePagedTable } from "@/hooks/usePagedTable";
import { formatDurationMs } from "@/lib/player-card-format";
import { RankBadge } from "./RankBadge";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { CompactBadgeChip } from "@/components/badges/CompactBadgeChip";
import type { LeaderboardPlayer, LeaderboardResponse } from "@/types/leaderboard";

export type { LeaderboardPlayer, LeaderboardResponse };

const SKELETON_WIDTHS = ["w-8", "w-32", "w-20"];

export interface TopPlayersTableProps {
  pageSize?:  number;
  className?: string;
}

export function TopPlayersTable({ pageSize = 10, className }: TopPlayersTableProps) {
  const t = useTranslations("Leaderboard");
  const tCard = useTranslations("PlayerCard");

  const fetcher = useCallback(async (page: number, query: string, sort?: string, order?: string) => {
    const params = new URLSearchParams({
      type:     "players",
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
    <PagedTableLayout
      className={className}
      titleNode={
        <span
          className="text-sm font-semibold text-foreground/80 tracking-wide"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("title")}
        </span>
      }
      total={total}
      totalIcon={<Users size={10} />}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder={t("searchPlaceholder")}
      isLoading={isLoading}
      error={state.status === "error" ? t("loadError", { message: state.message }) : null}
      isEmpty={!!data && data.items.length === 0}
      emptyMessage={query ? t("notFound", { query }) : t("empty")}
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
            <DocsTableHead sortable sortDirection={sortColumn === "rank" ? sortDirection : undefined} onSort={() => setSort("rank", "asc")} className="w-16 text-center align-middle" withRightBorder>{t("columns.rank")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "player" ? sortDirection : undefined} onSort={() => setSort("player", "asc")} className="align-middle"                  withRightBorder>{t("columns.player")}</DocsTableHead>
            <DocsTableHead sortable sortDirection={sortColumn === "playtime" ? sortDirection : undefined} onSort={() => setSort("playtime", "desc")} className="w-40 text-center align-middle"               >{t("columns.playtime")}</DocsTableHead>
          </DocsTableRow>
        </DocsTableHeader>
      }
    >
      {data && data.items.map((player) => {
        const isTopTen = player.rank <= 10;
        return (
          <DocsTableRow
            key={player.uuid}
            className={cn(
              "h-[76px]",
              isTopTen && "bg-amber-500/[0.06] !border-l-2 border-l-amber-500/50",
              isRefreshing && "opacity-40 transition-opacity"
            )}
          >
            <DocsTableCell className="text-center align-middle">
              <div className="flex justify-center">
                <RankBadge rank={player.rank} size={18} medalScale={1.35} variant="text" />
              </div>
            </DocsTableCell>

            <DocsTableCell className="align-middle">
              <PlayerAvatar
                avatarSize={36}
                name={player.name}
                skinUrl={player.skinUrl}
                hasSiteProfile={!!player.profileUsername}
                linked={!!player.profileUsername}
                online={player.online}
                siteOnline={player.siteOnline}
                nameNode={
                  query ? <HighlightMatch text={player.name} query={query} /> : undefined
                }
                appendNode={
                  player.badges && player.badges.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {player.badges.slice(0, 1).map((badge) => (
                        <CompactBadgeChip
                          key={badge.name}
                          name={badge.name}
                          icon={badge.icon}
                          color={badge.color}
                          description={badge.description}
                          earnCondition={badge.earnCondition}
                          size={15}
                        />
                      ))}
                    </div>
                  ) : null
                }
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
    </PagedTableLayout>
  );
}

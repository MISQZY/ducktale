"use client";

import { useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";
import {
  PagedTableLayout,
  HighlightMatch,
} from "@/components/docs/paged-table";
import { usePagedTable } from "@/hooks/usePagedTable";
import { httpErrorKey } from "@/lib/http-error-message";
import { formatDurationMs } from "@/lib/player-card-format";
import { RankBadge } from "./RankBadge";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { CompactBadgeChip } from "@/components/badges/CompactBadgeChip";
import type { LeaderboardPlayer, LeaderboardResponse } from "@/types/leaderboard";
import { localizedName } from "@/lib/i18n-name";

export type { LeaderboardPlayer, LeaderboardResponse };

const SKELETON_WIDTHS = ["w-8", "w-32", "w-20"];

export interface TopPlayersTableProps {
  pageSize?:  number;
  className?: string;
  /**
   * Server-prefetched page 1 (no search/sort) — same shape /api/leaderboard
   * returns, converted to PagedResponse's `items` shape the same way the
   * fetcher below does. See usePagedTable's initialData doc comment.
   */
  initialData?: LeaderboardResponse;
}

export function TopPlayersTable({ pageSize = 10, className, initialData }: TopPlayersTableProps) {
  const t = useTranslations("Leaderboard");
  const tCard = useTranslations("PlayerCard");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  const fetcher = useCallback(async (page: number, query: string, sort?: string, order?: string) => {
    const params = new URLSearchParams({
      type:     "players",
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
      // fetch() itself throwing (offline, DNS, CORS, ...) never carries a
      // real HTTP status — 0 stands in for "no response at all" (see
      // httpErrorKey).
      throw new Error(tCommon(httpErrorKey(0)));
    }
    if (!r.ok) throw new Error(tCommon(httpErrorKey(r.status)));
    const res: LeaderboardResponse = await r.json();
    return { ...res, items: res.players };
  }, [pageSize, tCommon]);

  const {
    state, query, page, data,
    sortColumn, sortDirection,
    isLoading, isRefreshing,
    pageStart, totalPages,
    pageNumbers, setQuery, setSort, goTo,
  } = usePagedTable<LeaderboardPlayer>({
    fetcher,
    initialData: initialData ? { ...initialData, items: initialData.players } : undefined,
  });

  const total = data?.total ?? null;

  const columns = useMemo<ColumnDef<LeaderboardPlayer, unknown>[]>(() => [
    {
      id: "rank",
      header: t("columns.rank"),
      size: 64,
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
      id: "player",
      header: t("columns.player"),
      size: 280,
      minSize: 160,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "player", defaultSortDirection: "asc" },
      cell: ({ row }) => {
        const player = row.original;
        return (
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
                      key={player.uuid}
                      name={localizedName(badge.name, locale)}
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
        );
      },
    },
    {
      id: "playtime",
      header: t("columns.playtime"),
      size: 160,
      minSize: 110,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", sortKey: "playtime", defaultSortDirection: "desc" },
      cell: ({ row }) => (
        <span className={cn("text-xs tabular-nums", DOCS_TABLE_THEME.textSoft)}>
          {formatDurationMs(row.original.playtimeMs, tCard)}
        </span>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [query, tCard]);

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
      error={state.status === "error" ? state.message : null}
      isEmpty={!!data && data.items.length === 0}
      emptyMessage={query ? t("notFound", { query }) : t("empty")}
      skeletonWidths={SKELETON_WIDTHS}
      page={page}
      totalPages={totalPages}
      pageStart={pageStart}
      pageSize={pageSize}
      pageNumbers={pageNumbers}
      goTo={goTo}
      columns={columns}
      data={data?.items ?? []}
      getRowId={(player) => player.uuid}
      showRowNumber={false}
      rowClassName={(player) =>
        cn(
          "h-[76px]",
          player.rank <= 10 && "bg-amber-500/[0.06] !border-l-2 border-l-amber-500/50",
          isRefreshing && "opacity-40 transition-opacity"
        )
      }
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={setSort}
    />
  );
}

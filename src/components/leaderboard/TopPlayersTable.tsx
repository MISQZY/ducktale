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

  const fetcher = useCallback(async (page: number, query: string) => {
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      ...(query ? { search: query } : {}),
    });
    const r = await fetch(`/api/leaderboard?${params}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const res: LeaderboardResponse = await r.json();
    return { ...res, items: res.players };
  }, [pageSize]);

  const {
    state, query, page, data,
    isLoading, isRefreshing,
    pageStart, totalPages,
    pageNumbers, setQuery, goTo,
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
              <DocsTableHead className="w-14">{t("columns.rank")}</DocsTableHead>
              <DocsTableHead>{t("columns.player")}</DocsTableHead>
              <DocsTableHead className="w-32">{t("columns.playtime")}</DocsTableHead>
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
                <DocsTableCell>
                  <RankBadge rank={player.rank} size={18} variant="text" />
                </DocsTableCell>

                <DocsTableCell>
                  {player.profileUsername ? (
                    <div
                      className={cn(
                        "relative overflow-hidden inline-flex h-11 items-center gap-3 py-1.5 pr-5 pl-1.5 rounded-lg border bg-card/40 transition-colors shadow-sm",
                        player.online ? "animate-border-glow-green border-emerald-500/40" : "border-primary/20 hover:border-primary/30"
                      )}
                    >
                      <SkinFace skinUrl={player.skinUrl} size={32} className="rounded-md border-none shrink-0" />
                      <div className="flex items-center gap-2.5 relative z-10">
                        <Link
                          href={`/profile/${encodeURIComponent(player.profileUsername)}`}
                          target="_blank"
                          className="hover:underline underline-offset-4 transition-colors"
                        >
                          <HighlightMatch
                            text={player.name}
                            query={query}
                            className="font-bold text-amber-600 dark:text-amber-400 text-base"
                          />
                        </Link>
                        
                        {player.badges.length > 0 && (
                          <div className="flex items-center gap-1">
                            {player.badges.slice(0, MAX_VISIBLE_BADGES).map((badge) => (
                              <CompactBadgeChip
                                key={badge.name}
                                name={badge.name}
                                icon={badge.icon}
                                color={badge.color}
                                description={badge.description}
                                earnCondition={badge.earnCondition}
                              />
                            ))}
                            {player.badges.length > MAX_VISIBLE_BADGES && (
                              <span
                                className="text-[0.65rem] text-foreground/40 shrink-0"
                                title={player.badges.slice(MAX_VISIBLE_BADGES).map((b) => b.name).join(", ")}
                              >
                                +{player.badges.length - MAX_VISIBLE_BADGES}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-11 items-center gap-2">
                      <HighlightMatch text={player.name} query={query} className="text-base" />
                      {player.online && (
                        <span className="relative flex h-1.5 w-1.5 shrink-0" title={tCard("online")}>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                      )}
                    </div>
                  )}
                </DocsTableCell>

                <DocsTableCell>
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

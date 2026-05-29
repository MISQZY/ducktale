"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck, Users, Infinity as InfinityIcon } from "lucide-react";
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
import type { WhitelistPlayer, WhitelistResponse } from "@/app/api/whitelist/route";

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
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400/70">
        <InfinityIcon size={12} />
        навсегда
      </span>
    );
  }
  return (
    <span className={cn(
      "text-xs tabular-nums",
      isExpired(expiresAt) ? "text-red-400/60 line-through" : "text-amber-300/70",
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
  const fetcher = useCallback(async (page: number, query: string) => {
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      ...(query    ? { search:   query    } : {}),
      ...(serverId ? { serverId: serverId } : {}),
    });
    const r = await fetch(`/api/whitelist?${params}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const res: WhitelistResponse = await r.json();
    // Normalise to the generic PagedResponse<WhitelistPlayer> shape.
    return { ...res, items: res.players };
  }, [pageSize, serverId]);

  const {
    state, query, page, data,
    isLoading, isRefreshing,
    pageStart, totalPages,
    pageNumbers, setQuery, goTo,
  } = usePagedTable<WhitelistPlayer>({ fetcher });

  const total = data?.total ?? null;

  return (
    <div className={cn("not-prose flex flex-col gap-3", className)}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-400/80 shrink-0" />
          <span
            className="text-sm font-semibold text-amber-100/80 tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title ?? "Вайтлист"}
          </span>
          {total !== null && (
            <DuckBadge variant="outline" className="gap-1 border-emerald-700/35 text-emerald-300/80 bg-emerald-950/20">
              <Users size={10} />
              {total}
            </DuckBadge>
          )}
        </div>

        <TableSearch
          value={query}
          onChange={setQuery}
          placeholder="Поиск по нику…"
        />
      </div>

      {/* Table */}
      <DocsTable>
        <DocsTableHeader>
          <DocsTableRow>
            <DocsTableHead className="w-12" withRightBorder>№</DocsTableHead>
            <DocsTableHead                  withRightBorder>Игрок</DocsTableHead>
            <DocsTableHead className="w-28" withRightBorder>Добавил</DocsTableHead>
            <DocsTableHead className="w-28" withRightBorder>Добавлен</DocsTableHead>
            <DocsTableHead className="w-28"               >Действителен до</DocsTableHead>
          </DocsTableRow>
        </DocsTableHeader>

        <DocsTableBody className="[&_tr:last-child]:border-0">
          {isLoading && <TableSkeleton rows={pageSize} cellWidths={SKELETON_WIDTHS} />}

          {state.status === "error" && (
            <DocsTableRow>
              <DocsTableCell colSpan={5} className="text-center py-10">
                <p className="text-sm text-red-400/70">Не удалось загрузить список: {state.message}</p>
              </DocsTableCell>
            </DocsTableRow>
          )}

          {data && !isLoading && data.items.length === 0 && (
            <DocsTableRow>
              <DocsTableCell colSpan={5} className="text-center py-10">
                <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>
                  {query ? `Игрок «${query}» не найден` : "Вайтлист пуст"}
                </p>
              </DocsTableCell>
            </DocsTableRow>
          )}

          {data && data.items.map((player, index) => (
            <DocsTableRow
              key={player.id}
              className={cn(isRefreshing && "opacity-40 transition-opacity")}
            >
              <DocsTableCell withRightBorder className={cn("font-mono text-xs tabular-nums", DOCS_TABLE_THEME.textFaint)}>
                {pageStart + index + 1}
              </DocsTableCell>

              <DocsTableCell withRightBorder>
                <HighlightMatch text={player.name} query={query} />
              </DocsTableCell>

              <DocsTableCell withRightBorder>
                <span className={cn("text-xs font-medium", DOCS_TABLE_THEME.textSoft)}>
                  {player.moderator}
                </span>
              </DocsTableCell>

              <DocsTableCell withRightBorder>
                <span className={cn("text-xs tabular-nums", DOCS_TABLE_THEME.textFaint)}>
                  {formatDate(player.addedAt)}
                </span>
              </DocsTableCell>

              <DocsTableCell>
                <ExpiryCell expiresAt={player.expiresAt} />
              </DocsTableCell>
            </DocsTableRow>
          ))}
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
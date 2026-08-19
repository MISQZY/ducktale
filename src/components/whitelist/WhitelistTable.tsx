"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { ColumnDef } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { Users, Infinity as InfinityIcon } from "lucide-react";
import { usePagedTable } from "@/hooks/usePagedTable";
import { httpErrorKey } from "@/lib/http-error-message";
import { HighlightMatch, PagedTableLayout } from "@/components/docs/paged-table";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";

import { SERVERS } from "@/config/servers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAdaptivePageSize } from "@/hooks/useAdaptivePageSize";

export type { WhitelistPlayer, WhitelistResponse } from "@/types/whitelist";
import type { WhitelistPlayer, WhitelistResponse } from "@/types/whitelist";

// ─── Utility ──────────────────────────────────────────────────────────────────

const DATE_FMT = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit", month: "2-digit", year: "numeric",
});

function formatDate(ms: number): string {
  return ms ? DATE_FMT.format(new Date(ms)) : "—";
}

function isExpired(expiresAt: number) {
  if (expiresAt === 0) return false;
  return Date.now() > expiresAt;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SKELETON_WIDTHS = ["w-32", "w-16", "w-16", "w-24", "w-20", "w-20", "w-8"];

function ExpiryCell({ expiresAt }: { expiresAt: number }) {
  if (expiresAt === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-foreground/40 font-medium">
        <InfinityIcon size={12} strokeWidth={2.5} />
        Навсегда
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
  pageSize?:  number;
  className?: string;
  isAdmin?:   boolean;
  serverId?:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WhitelistTable({
  pageSize: defaultPageSize = 15,
  className,
  isAdmin = false,
  serverId: externalServerId,
}: WhitelistTableProps) {
  const tCommon = useTranslations("Common");
  const tAdmin = useTranslations("Admin.users");
  const searchParams = useSearchParams();
  const pageSize = parseInt(searchParams.get("pageSize") || "") || defaultPageSize;
  const [internalServerId, setInternalServerId] = useState<string>("");
  
  const effectiveServerId = externalServerId !== undefined ? externalServerId : internalServerId;
  const adaptiveRef = useAdaptivePageSize({ currentPageSize: pageSize, rowHeightPx: 48, bottomReservePx: isAdmin ? 340 : 200 });

  // Build a stable fetcher that maps the API response to the generic PagedResponse<T> shape.
  const fetcher = useCallback(async (page: number, query: string, sort?: string, order?: string) => {
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      ...(effectiveServerId ? { serverId: effectiveServerId } : {}),
      ...(query ? { search: query } : {}),
      ...(sort ? { sort } : {}),
      ...(order ? { order } : {}),
    });
    let r: Response;
    try {
      r = await fetch("/api/whitelist?" + params.toString());
    } catch {
      throw new Error(tCommon(httpErrorKey(0)));
    }
    if (!r.ok) throw new Error(tCommon(httpErrorKey(r.status)));
    const res: WhitelistResponse = await r.json();
    return { ...res, items: res.players };
  }, [pageSize, effectiveServerId, tCommon]);

  const {
    state, query, page, data,
    sortColumn, sortDirection,
    isLoading, isRefreshing,
    pageStart, totalPages,
    pageNumbers, setQuery, setSort, goTo,
  } = usePagedTable<WhitelistPlayer>({
    fetcher,
    cacheKeyPrefix: `${effectiveServerId}:${pageSize}`,
    defaultSortColumn: "addedAt",
    defaultSortDirection: "desc",
  });

  const [prevServerId, setPrevServerId] = useState(effectiveServerId);
  const [prevPageSize, setPrevPageSize] = useState(pageSize);

  if (effectiveServerId !== prevServerId || pageSize !== prevPageSize) {
    setPrevServerId(effectiveServerId);
    setPrevPageSize(pageSize);
    goTo(1);
  }

  const total = data?.total ?? null;

  const columns = useMemo<ColumnDef<WhitelistPlayer, unknown>[]>(() => [
    {
      id: "name",
      header: "Игрок",
      size: 100,
      minSize: 80,
      enableHiding: false,
      meta: { withRightBorder: true, sortKey: "name" },
      cell: ({ row }) => (
        <span className="font-medium text-[13px] text-foreground/90">
          <HighlightMatch text={row.original.name} query={query} />
        </span>
      ),
    },
    {
      id: "server",
      header: "Сервер",
      size: 70,
      minSize: 60,
      meta: { withRightBorder: true },
      cell: ({ row }) => {
        const s = SERVERS.find((s) => s.uuid === row.original.server);
        if (!s) return <span className="text-xs text-foreground/40">—</span>;
        return (
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", s.badge, s.border)}>
            {s.name}
          </span>
        );
      },
    },
    {
      id: "moderator",
      header: "Добавил",
      size: 70,
      minSize: 60,
      meta: { withRightBorder: true, sortKey: "moderator" },
      cell: ({ row }) => (
        <span className={cn("text-xs font-medium", DOCS_TABLE_THEME.textSoft)}>
          {row.original.moderator}
        </span>
      ),
    },
    {
      id: "reason",
      header: "Причина",
      size: 100,
      minSize: 80,
      meta: { withRightBorder: true, headClassName: "w-full", cellClassName: "w-full" },
      cell: ({ row }) => (
        <span className={cn("text-xs", DOCS_TABLE_THEME.textSoft)}>
          {row.original.reason || "—"}
        </span>
      ),
    },
    {
      id: "addedAt",
      header: "Добавлен",
      size: 70,
      minSize: 60,
      meta: { withRightBorder: true, sortKey: "addedAt" },
      cell: ({ row }) => (
        <span className={cn("text-xs tabular-nums", DOCS_TABLE_THEME.textFaint)}>
          {formatDate(row.original.addedAt)}
        </span>
      ),
    },
    {
      id: "expiresAt",
      header: "Действителен",
      size: 80,
      minSize: 60,
      meta: { sortKey: "expiresAt", withRightBorder: isAdmin },
      cell: ({ row }) => <ExpiryCell expiresAt={row.original.expiresAt} />,
    },
    ...(isAdmin ? [{
      id: "actions",
      header: "Действия",
      size: 60,
      minSize: 60,
      enableHiding: false,
      meta: { headClassName: "text-center", cellClassName: "text-center" },
      cell: ({ row }: { row: { original: WhitelistPlayer } }) => (
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "bg-card/70 hover:text-destructive hover:border-destructive/40"
          )}
          title="Удалить проходку"
          onClick={() => {
            // TODO: implement delete
          }}
        >
          <Trash2 size={14} />
        </button>
      ),
    } as ColumnDef<WhitelistPlayer, unknown>] : []),
  ], [query, isAdmin]);

  return (
    <div ref={adaptiveRef} className={className}>
      <PagedTableLayout storageKey="WhitelistTable" className="h-full min-w-0 overflow-hidden"
        titleNode={
          externalServerId !== undefined ? (
            <span
              className="text-sm font-semibold text-foreground/80 tracking-wide"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Проходки
            </span>
          ) : (
            <div className="flex items-center gap-4">
              <span
                className="text-sm font-semibold text-foreground/80 tracking-wide"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Проходки
              </span>
              <Select value={internalServerId} onValueChange={(val) => setInternalServerId(val === "all" ? "" : val)}>
                <SelectTrigger className="w-[180px] h-8 text-xs bg-background/50">
                  <SelectValue placeholder="Все серверы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все серверы</SelectItem>
                  {SERVERS.map((s) => (
                    <SelectItem key={s.uuid} value={s.uuid}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
        total={total}
        totalIcon={<Users size={10} />}
        query={query}
        onQueryChange={setQuery}
        data={data?.items ?? []}
        columns={columns as any}
        isLoading={isLoading}
        error={state.status === "error" ? state.message : null}
        isEmpty={!!data && data.items.length === 0}
        emptyMessage={query ? `Игрок «${query}» не найден` : "Ничего не найдено"}
        skeletonWidths={SKELETON_WIDTHS}
        page={page}
        totalPages={totalPages}
        pageStart={pageStart}
        pageSize={pageSize}
        pageNumbers={pageNumbers}
        goTo={goTo}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={setSort}
      />
    </div>
  );
}

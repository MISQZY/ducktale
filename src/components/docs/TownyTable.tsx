"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Landmark, ChevronDown, Users } from "lucide-react";
import {
  DocsTableRow,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
import { DuckBadge } from "@/components/ui/duck/badge";
import {
  PagedTableLayout,
} from "@/components/docs/paged-table";
import { usePagedTable } from "@/hooks/usePagedTable";
import { RESIDENT_ROLE_COLOR } from "@/lib/towny";
import { TownNameLabel, TownNationBadge } from "@/components/towny/TownCells";
import type { Resident, ResidentRole, Town, TownyResponse } from "@/types/towny";

// ─── Re-export types so consumers import from one place ────────────────────────
export type { Town, TownyResponse };

const SKELETON_WIDTHS = ["w-40", "w-24", "w-16"];

// Badge chrome (border/bg) layered on top of the role's shared text color —
// see RESIDENT_ROLE_COLOR in @/lib/towny, also used by the player card.
const RESIDENT_BADGE_STYLE: Record<Exclude<ResidentRole, null>, string> = {
  mayor:  cn("border-gold-500/40 bg-gold-500/10", RESIDENT_ROLE_COLOR.mayor),
  deputy: cn("border-slate-400/40 bg-slate-400/10", RESIDENT_ROLE_COLOR.deputy),
};

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
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // Build a stable fetcher that maps the API response to the generic PagedResponse<T> shape.
  const fetcher = useCallback(async (page: number, query: string, sort?: string, order?: string) => {
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      ...(query ? { search: query } : {}),
      ...(sort ? { sort } : {}),
      ...(order ? { order } : {}),
    });
    const r = await fetch(`/api/towns?${params}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const res: TownyResponse = await r.json();
    // Normalise to the generic PagedResponse<Town> shape.
    return { ...res, items: res.towns };
  }, [pageSize]);

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
      size: 260,
      minSize: 140,
      enableHiding: false,
      meta: { withRightBorder: true, sortKey: "town" },
      cell: ({ row }) => {
        const town = row.original;
        const isOpen = expanded.has(town.name);
        const hasResidents = town.residents.length > 0;
        return (
          <button
            type="button"
            onClick={() => hasResidents && toggle(town.name)}
            disabled={!hasResidents}
            className={cn(
              "flex items-center gap-1.5 text-left",
              hasResidents ? "cursor-pointer group/town" : "cursor-default",
            )}
            aria-expanded={isOpen}
          >
            {hasResidents ? (
              <ChevronDown
                size={13}
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  DOCS_TABLE_THEME.iconFaint,
                  "group-hover/town:text-foreground",
                  isOpen && "rotate-180"
                )}
              />
            ) : (
              <span className="w-3.25 shrink-0" />
            )}
            <TownNameLabel tag={town.tag} name={town.name} query={query} />
          </button>
        );
      },
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
      size: 100,
      minSize: 72,
      meta: { sortKey: "size" },
      cell: ({ row }) => (
        <span className={cn("text-xs font-mono tabular-nums", DOCS_TABLE_THEME.textSoft)}>
          {row.original.size}
        </span>
      ),
    },
  ], [query, expanded, toggle]);

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
      error={state.status === "error" ? `Не удалось загрузить список: ${state.message}` : null}
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
      rowClassName={() => cn(isRefreshing && "opacity-40 transition-opacity")}
      renderExtraRow={(town) => {
        const isOpen = expanded.has(town.name);
        const hasResidents = town.residents.length > 0;
        if (!isOpen || !hasResidents) return null;
        return (
          <DocsTableRow key={`${town.name}-residents`} className={DOCS_TABLE_THEME.rowHover}>
            <DocsTableCell colSpan={3} className="bg-muted/40 py-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Users size={12} className={cn("shrink-0", DOCS_TABLE_THEME.iconFaint)} />
                {town.residents.map((resident: Resident) => (
                  <DuckBadge
                    key={resident.display}
                    variant="outline"
                    className={cn(
                      "text-xs",
                      resident.role
                        ? RESIDENT_BADGE_STYLE[resident.role]
                        : "bg-card text-foreground/70 border-border"
                    )}
                  >
                    {resident.display}
                  </DuckBadge>
                ))}
              </div>
            </DocsTableCell>
          </DocsTableRow>
        );
      }}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={setSort}
    />
  );
}

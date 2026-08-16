"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";
import { useAdminTableSort } from "@/hooks/useAdminTableSort";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { RankRowActions } from "@/components/admin/RankRowActions";
import { RankUsersDialog } from "@/components/admin/RankUsersDialog";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

export interface AdminRankRow {
  id: string;
  group: string;
  name: LocalizedName;
  icon: string;
  color: string | null;
}

interface AdminRanksTableProps {
  lang: string;
  ranks: AdminRankRow[];
  /** group -> lp_tracks it appears in, and group -> current holder count — plain arrays instead of Map since this crosses the server/client boundary as a prop. */
  tracksByGroup: [string, string[]][];
  userCounts: [string, number][];
  groupSuggestions: string[];
  /** ranks-edit (or isAdmin) — gates the edit dialog. Independent of canDelete (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canEdit: boolean;
  /** ranks-delete (or isAdmin) — gates the delete button specifically. */
  canDelete: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
}

/** Client island for /admin/ranks — see AdminBadgesTable's doc comment for why the columns live here, not in the Server Component page. */
export function AdminRanksTable({ lang, ranks, tracksByGroup, userCounts, groupSuggestions, canEdit, canDelete, sortColumn, sortDirection }: AdminRanksTableProps) {
  const t = useTranslations("Admin");
  const tr = useTranslations("Admin.ranks");
  const onSort = useAdminTableSort(sortColumn, sortDirection);

  const tracksMap = useMemo(() => new Map(tracksByGroup), [tracksByGroup]);
  const countsMap = useMemo(() => new Map(userCounts), [userCounts]);

  const columns = useMemo<ColumnDef<AdminRankRow, unknown>[]>(() => [
    {
      id: "name",
      header: tr("nameLabel"),
      size: 240,
      minSize: 160,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "name", defaultSortDirection: "asc" },
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2">
          <BadgeIcon name={row.original.icon} size={16} style={{ color: row.original.color ?? undefined }} />
          {localizedName(row.original.name, lang)}
        </span>
      ),
    },
    {
      id: "group",
      header: tr("groupLabel"),
      size: 160,
      minSize: 100,
      meta: { headClassName: "align-middle", cellClassName: "align-middle font-mono text-xs text-foreground/60", withRightBorder: true, sortKey: "group", defaultSortDirection: "asc" },
      cell: ({ row }) => row.original.group,
    },
    {
      id: "tracks",
      header: tr("tracksLabel"),
      size: 220,
      minSize: 120,
      meta: { headClassName: "align-middle", cellClassName: "align-middle text-xs text-foreground/50 whitespace-normal", withRightBorder: true },
      cell: ({ row }) => (tracksMap.get(row.original.group) ?? []).join(", ") || "—",
    },
    {
      id: "users",
      header: "Пользователи",
      size: 130,
      minSize: 90,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <RankUsersDialog lang={lang} group={row.original.group} count={countsMap.get(row.original.group) || 0} />
      ),
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      size: 100,
      minSize: 76,
      enableHiding: false,
      meta: { headClassName: "align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => <RankRowActions lang={lang} rank={row.original} groupSuggestions={groupSuggestions} canEdit={canEdit} canDelete={canDelete} />,
    },
  ], [lang, groupSuggestions, canEdit, canDelete, t, tr, tracksMap, countsMap]);

  return (
    <DataTable
      columns={columns}
      data={ranks}
      getRowId={(r) => r.id}
      emptyMessage={tr("noResults")}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
    />
  );
}

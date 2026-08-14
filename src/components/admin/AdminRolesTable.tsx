"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { RoleRowActions } from "@/components/admin/RoleRowActions";
import { RoleUsersDialog } from "@/components/admin/RoleUsersDialog";

export interface AdminRoleRow {
  id: string;
  group: string;
  name: string;
  icon: string;
  color: string | null;
}

interface AdminRolesTableProps {
  lang: string;
  roles: AdminRoleRow[];
  /** group -> lp_tracks it appears in, and group -> current holder count — plain arrays instead of Map since this crosses the server/client boundary as a prop. */
  tracksByGroup: [string, string[]][];
  userCounts: [string, number][];
  groupSuggestions: string[];
}

/** Client island for /admin/roles — see AdminBadgesTable's doc comment for why the columns live here, not in the Server Component page. */
export function AdminRolesTable({ lang, roles, tracksByGroup, userCounts, groupSuggestions }: AdminRolesTableProps) {
  const t = useTranslations("Admin");
  const tr = useTranslations("Admin.roles");

  const tracksMap = useMemo(() => new Map(tracksByGroup), [tracksByGroup]);
  const countsMap = useMemo(() => new Map(userCounts), [userCounts]);

  const columns = useMemo<ColumnDef<AdminRoleRow, unknown>[]>(() => [
    {
      id: "name",
      header: tr("nameLabel"),
      meta: { headClassName: "w-[250px] align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2">
          <BadgeIcon name={row.original.icon} size={16} style={{ color: row.original.color ?? undefined }} />
          {row.original.name}
        </span>
      ),
    },
    {
      id: "group",
      header: tr("groupLabel"),
      meta: { headClassName: "align-middle", cellClassName: "align-middle font-mono text-xs text-foreground/60", withRightBorder: true },
      cell: ({ row }) => row.original.group,
    },
    {
      id: "tracks",
      header: tr("tracksLabel"),
      meta: { headClassName: "align-middle", cellClassName: "align-middle text-xs text-foreground/50", withRightBorder: true },
      cell: ({ row }) => (tracksMap.get(row.original.group) ?? []).join(", ") || "—",
    },
    {
      id: "users",
      header: "Пользователи",
      meta: { headClassName: "w-[120px] text-center align-middle", cellClassName: "text-center align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <RoleUsersDialog lang={lang} group={row.original.group} count={countsMap.get(row.original.group) || 0} />
      ),
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      meta: { headClassName: "w-[120px] align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => <RoleRowActions lang={lang} role={row.original} groupSuggestions={groupSuggestions} />,
    },
  ], [lang, groupSuggestions, t, tr, tracksMap, countsMap]);

  return <DataTable columns={columns} data={roles} getRowId={(r) => r.id} emptyMessage={tr("noResults")} />;
}

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useAdminTableSort } from "@/hooks/useAdminTableSort";
import { BadgeChip } from "@/components/badges/BadgeChip";
import { BadgeRowActions } from "@/components/admin/BadgeRowActions";
import { BadgeUsersDialog } from "@/components/admin/BadgeUsersDialog";
import type { RoleOption } from "@/components/admin/BadgeFormDialog";

export interface AdminBadgeRow {
  id: string;
  name: string;
  description: string | null;
  earnCondition: string | null;
  icon: string;
  color: string | null;
  autoRoleIds: string[];
  _count: { userBadges: number };
}

interface AdminBadgesTableProps {
  lang: string;
  badges: AdminBadgeRow[];
  roleOptions: RoleOption[];
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  rowOffset?: number;
}

/**
 * Client island rendering the /admin/badges table — a Server Component page
 * can't hand a ColumnDef[] (its `cell` entries are plain closures) to a
 * Client Component as a prop, since functions aren't serializable across
 * the RSC boundary. So the columns are built here, inside the client tree,
 * from the already-fetched plain data the page passes in — same pattern
 * AdminUserActions/UserBadgesCell already use for this page's other
 * interactive pieces.
 */
export function AdminBadgesTable({ lang, badges, roleOptions, sortColumn, sortDirection, rowOffset }: AdminBadgesTableProps) {
  const t = useTranslations("Admin");
  const tb = useTranslations("Admin.badges");
  const onSort = useAdminTableSort(sortColumn, sortDirection);

  const columns = useMemo<ColumnDef<AdminBadgeRow, unknown>[]>(() => [
    {
      id: "badge",
      header: tb("badgeColumn"),
      size: 250,
      minSize: 160,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "badge", defaultSortDirection: "asc" },
      cell: ({ row }) => <BadgeChip name={row.original.name} icon={row.original.icon} color={row.original.color} />,
    },
    {
      id: "description",
      header: tb("descriptionColumn"),
      size: 320,
      minSize: 140,
      meta: { headClassName: "align-middle", cellClassName: "align-middle whitespace-normal", withRightBorder: true },
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          {row.original.description && (
            <span className="text-foreground/80 text-xs font-medium">{row.original.description}</span>
          )}
          {row.original.earnCondition && (
            <span className="text-foreground/45 text-[0.65rem]">{tb("earnConditionPrefix")} {row.original.earnCondition}</span>
          )}
        </div>
      ),
    },
    {
      id: "awarded",
      header: tb("awardedColumn"),
      size: 120,
      minSize: 90,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", withRightBorder: true, sortKey: "awarded", defaultSortDirection: "desc" },
      cell: ({ row }) => (
        <BadgeUsersDialog lang={lang} badgeId={row.original.id} badgeName={row.original.name} count={row.original._count.userBadges} />
      ),
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      size: 100,
      minSize: 76,
      enableHiding: false,
      meta: { headClassName: "align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => <BadgeRowActions lang={lang} badge={row.original} roleOptions={roleOptions} />,
    },
  ], [lang, roleOptions, t, tb]);

  return (
    <DataTable
      columns={columns}
      data={badges}
      getRowId={(b) => b.id}
      emptyMessage={tb("noResults")}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      rowOffset={rowOffset}
    />
  );
}

"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";
import { useAdminTableSort } from "@/hooks/useAdminTableSort";
import { useAdaptivePageSize } from "@/hooks/useAdaptivePageSize";
import { BadgeChip } from "@/components/badges/BadgeChip";
import { BadgeRowActions } from "@/components/admin/BadgeRowActions";
import { BadgeUsersDialog } from "@/components/admin/BadgeUsersDialog";
import type { RoleOption } from "@/components/admin/BadgeFormDialog";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

export interface AdminBadgeRow {
  id: string;
  name: LocalizedName;
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
  /** badges-edit (or isAdmin) — a badges-view-only holder can reach this page but shouldn't see edit/revoke controls. */
  canEdit: boolean;
  /** badges-delete (or isAdmin) — independent of canEdit (see RESOURCE_ROLE_ACTIONS's doc comment), gates only the delete button. */
  canDelete: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  rowOffset?: number;
  /** "Create badge" icon-button dialog trigger, built by the page (needs translations) — rendered in the table's own toolbar row next to the columns button. */
  createSlot?: ReactNode;
  /** The page's PAGE_SIZE — pads a short page (typically the last one) with blank rows so the table height stays constant across pages. */
  pageSize?: number;
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
export function AdminBadgesTable({ lang, badges, roleOptions, canEdit, canDelete, sortColumn, sortDirection, rowOffset, createSlot, pageSize }: AdminBadgesTableProps) {
  const t = useTranslations("Admin");
  const tb = useTranslations("Admin.badges");
  const onSort = useAdminTableSort(sortColumn, sortDirection);
  const adaptiveRef = useAdaptivePageSize({ currentPageSize: pageSize ?? 10, rowHeightPx: 76 });

  const columns = useMemo<ColumnDef<AdminBadgeRow, unknown>[]>(() => [
    {
      id: "badge",
      header: tb("badgeColumn"),
      size: 250,
      minSize: 160,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "badge", defaultSortDirection: "asc" },
      cell: ({ row }) => <BadgeChip name={localizedName(row.original.name, lang)} icon={row.original.icon} color={row.original.color} />,
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
        <BadgeUsersDialog lang={lang} badgeId={row.original.id} badgeName={localizedName(row.original.name, lang)} count={row.original._count.userBadges} canEdit={canEdit} />
      ),
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      size: 100,
      minSize: 76,
      enableHiding: false,
      meta: { headClassName: "align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => <BadgeRowActions lang={lang} badge={row.original} roleOptions={roleOptions} canEdit={canEdit} canDelete={canDelete} />,
    },
  ], [lang, roleOptions, canEdit, canDelete, t, tb]);

  return (
    <div ref={adaptiveRef}>
      <DataTable storageKey="AdminBadgesTable" columns={columns}
        data={badges}
        getRowId={(b) => b.id}
        emptyMessage={tb("noResults")}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        rowOffset={rowOffset}
        toolbarRight={createSlot}
        minRows={pageSize}
        rowHeightClassName="h-[76px]"
      />
    </div>
  );
}


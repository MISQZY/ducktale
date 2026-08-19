"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { Edit, Eye, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ResourceRoleLabelFormDialog } from "@/components/admin/ResourceRoleLabelFormDialog";
import { AccessMark } from "@/components/admin/ResourceRoleAccessGrid";
import { RESOURCE_ROLE_ACTIONS, type Resource } from "@/config/resource-roles";

export interface AdminResourceRoleRow {
  resource: Resource;
  /** Effective display name (admin override if set, else the code-defined i18n default) — see getResourceLabels(), src/lib/resource-role-labels.ts. */
  resourceNameRu: string;
  resourceNameEn: string;
}

interface AdminResourceRolesTableProps {
  lang: string;
  rows: AdminResourceRoleRow[];
  /** resource-roles-edit (or isAdmin) — a resource-roles-view-only holder sees the same rows but no rename button. */
  canEdit: boolean;
}

/** Client island for /admin/resource-roles — a fixed catalog (RESOURCE_ROLE_ACTIONS), not a query result, so unlike every other admin table there's no pagination, just a fixed alphabetical ordering by the current locale's display name ("[...]"-prefixed admin-page resources first, see sortedRows below). One row per resource, View/Edit/Delete shown as the same read-only access marks ResourceRoleAccessGrid uses for a Role's grants — checked means the action exists for that resource, dash means it doesn't. The only "edit" is renaming a resource's display label (ResourceRoleLabel override), not the catalog itself. See [[PERMISSIONS_BADGES]] §4.1/§4.5. */
export function AdminResourceRolesTable({ lang, rows, canEdit }: AdminResourceRolesTableProps) {
  const t = useTranslations("Admin");
  const tr = useTranslations("Admin.resourceRoles");
  const tal = useTranslations("Admin.resourceRoles.actionLabels");

  const resourceName = useCallback((r: AdminResourceRoleRow): string => (lang === "ru" ? r.resourceNameRu : r.resourceNameEn), [lang]);

  // Alphabetical by the visible label, but "[Админ]"/"[Admin]" (admin-page
  // resources) sort as a group before the plain (public-page) ones instead
  // of "[" falling wherever the locale's collation happens to place it.
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const nameA = resourceName(a);
      const nameB = resourceName(b);
      const bracketedA = nameA.startsWith("[");
      const bracketedB = nameB.startsWith("[");
      if (bracketedA !== bracketedB) return bracketedA ? -1 : 1;
      return nameA.localeCompare(nameB, lang);
    });
  }, [rows, resourceName, lang]);

  const columns = useMemo<ColumnDef<AdminResourceRoleRow, unknown>[]>(() => [
    {
      id: "resource",
      header: tr("resourceColumn"),
      size: 260,
      minSize: 160,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => resourceName(row.original),
    },
    {
      id: "view",
      // Icon, not the full "Просмотр" word — that wrapped onto two lines in
      // this narrow a column and blew out the whole header row's height.
      header: () => <Eye size={13} className="mx-auto" aria-label={tal("view")} />,
      size: 64,
      minSize: 48,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <AccessMark state={(RESOURCE_ROLE_ACTIONS[row.original.resource] as readonly string[]).includes("view") ? "granted" : "na"} />
      ),
    },
    {
      id: "edit",
      header: () => <Pencil size={12} className="mx-auto" aria-label={tal("edit")} />,
      size: 64,
      minSize: 48,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <AccessMark state={(RESOURCE_ROLE_ACTIONS[row.original.resource] as readonly string[]).includes("edit") ? "granted" : "na"} />
      ),
    },
    {
      id: "delete",
      header: () => <Trash2 size={12} className="mx-auto" aria-label={tal("delete")} />,
      size: 64,
      minSize: 48,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <AccessMark state={(RESOURCE_ROLE_ACTIONS[row.original.resource] as readonly string[]).includes("delete") ? "granted" : "na"} />
      ),
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      size: 90,
      minSize: 70,
      enableHiding: false,
      meta: { headClassName: "align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) =>
        canEdit ? (
          <ResourceRoleLabelFormDialog
            lang={lang}
            resource={row.original.resource}
            currentNameRu={row.original.resourceNameRu}
            currentNameEn={row.original.resourceNameEn}
            trigger={{
              icon: <Edit size={14} />,
              label: tr("editLabelTitle"),
              size: "icon-sm",
              className: "bg-card/70 hover:text-primary hover:border-primary/40",
            }}
          />
        ) : null,
    },
  ], [lang, canEdit, t, tr, tal, resourceName]);

  return (
    <DataTable storageKey="AdminResourceRolesTable" columns={columns}
      data={sortedRows}
      getRowId={(r) => r.resource}
      emptyMessage={tr("noResults")}
      minRows={8}
      rowHeightClassName="h-[76px]"
      rowHeightPx={76}
      fillViewport
      viewportBottomReservePx={80}
    />
  );
}


"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { Lock } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { RoleRowActions } from "@/components/admin/RoleRowActions";
import { RoleUsersDialog } from "@/components/admin/RoleUsersDialog";
import { RoleGrantsPopover } from "@/components/admin/RoleGrantsPopover";
import { RowLevelRolesPopover } from "@/components/admin/RowLevelRolesPopover";
import type { RoleOption, RowLevelRoleOption } from "@/components/admin/RoleFormDialog";
import type { ResourceRole } from "@/config/resource-roles";
import type { ResourceLabelMap } from "@/lib/resource-role-labels";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

export interface AdminRoleRow {
  id: string;
  name: LocalizedName;
  resourceRoles: ResourceRole[];
  includedRoleIds: string[];
  rowLevelRoleIds: string[];
  userCount: number;
  /** Built-in (key !== null, src/config/roles.ts) — can't be deleted. */
  isSystem: boolean;
  /** The built-in "Гостевая" Role — can't be assigned to a real user (assertAssignableToUser, src/lib/actions/admin-roles.ts), so its "Users" cell has nothing to show or click into. */
  isGuest: boolean;
  /** Built-in AND locked (none of BUILTIN_ROLE_DEFINITIONS today) — renaming is still allowed, but grants/inclusions are fixed. */
  isLocked: boolean;
}

interface AdminRolesTableProps {
  lang: string;
  roles: AdminRoleRow[];
  /** Every RowLevelRole, for RoleFormDialog's "pull in row-level roles" picker and for resolving this table's own column below. */
  rowLevelRoleOptions: RowLevelRoleOption[];
  resourceLabels: ResourceLabelMap;
  /** role-edit (or isAdmin) — a role-view-only holder sees the same rows but no edit/assign/revoke controls. */
  canEdit: boolean;
  /** role-delete (or isAdmin) — independent of canEdit (see RESOURCE_ROLE_ACTIONS's doc comment), gates only the delete button. */
  canDelete: boolean;
}

/** Client island for /admin/roles — see AdminBadgesTable's doc comment for why the columns live here, not in the Server Component page. */
export function AdminRolesTable({ lang, roles, rowLevelRoleOptions, resourceLabels, canEdit, canDelete }: AdminRolesTableProps) {
  const t = useTranslations("Admin");
  const tr = useTranslations("Admin.roles");

  const roleName = useCallback((r: { name: LocalizedName }): string => localizedName(r.name, lang), [lang]);

  const roleById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const rowLevelRoleById = useMemo(() => new Map(rowLevelRoleOptions.map((r) => [r.id, r])), [rowLevelRoleOptions]);
  // Every row can offer every OTHER role as an inclusion candidate — built
  // once here rather than per-row, since it's the same set minus self.
  const roleOptions = useMemo<RoleOption[]>(() => roles.map((r) => ({ id: r.id, name: r.name })), [roles]);

  const columns = useMemo<ColumnDef<AdminRoleRow, unknown>[]>(() => [
    {
      id: "name",
      header: tr("nameLabel"),
      size: 200,
      minSize: 140,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5">
          {roleName(row.original)}
          {row.original.isSystem && (
            <span title={row.original.isLocked ? tr("isLockedLabel") : tr("isSystemLabel")} className="flex shrink-0">
              <Lock size={12} className="text-foreground/40" />
            </span>
          )}
        </span>
      ),
    },
    {
      id: "grants",
      header: tr("resourceRolesLabel"),
      size: 140,
      minSize: 110,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <RoleGrantsPopover lang={lang} resourceRoles={row.original.resourceRoles} resourceLabels={resourceLabels} />
      ),
    },
    {
      id: "includedRoles",
      header: tr("includedRolesLabel"),
      size: 200,
      minSize: 130,
      meta: { headClassName: "align-middle", cellClassName: "align-middle whitespace-normal text-xs text-foreground/60", withRightBorder: true },
      cell: ({ row }) => {
        const includedRoleNames = row.original.includedRoleIds
          .map((id) => roleById.get(id))
          .filter((r): r is AdminRoleRow => !!r)
          .map(roleName);
        if (includedRoleNames.length === 0) return <span className="text-foreground/30">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {includedRoleNames.map((name, i) => (
              <span key={i} className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[11px] text-foreground/70">
                {name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "rowLevelRoles",
      header: tr("rowLevelRolesLabel"),
      size: 140,
      minSize: 110,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => {
        const rowLevelRoleNames = row.original.rowLevelRoleIds
          .map((id) => rowLevelRoleById.get(id))
          .filter((r): r is RowLevelRoleOption => !!r)
          .map(roleName);
        return <RowLevelRolesPopover names={rowLevelRoleNames} />;
      },
    },
    {
      id: "users",
      header: tr("usersColumn"),
      size: 130,
      minSize: 90,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", withRightBorder: true },
      cell: ({ row }) => (
        row.original.isGuest
          ? <span className="text-foreground/30">—</span>
          : <RoleUsersDialog lang={lang} roleId={row.original.id} roleName={roleName(row.original)} count={row.original.userCount} canEdit={canEdit} />
      ),
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      size: 100,
      minSize: 76,
      enableHiding: false,
      meta: { headClassName: "align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => (
        <RoleRowActions
          lang={lang}
          role={row.original}
          roleOptions={roleOptions.filter((r) => r.id !== row.original.id)}
          rowLevelRoleOptions={rowLevelRoleOptions}
          resourceLabels={resourceLabels}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ], [lang, canEdit, canDelete, t, tr, roleName, roleById, rowLevelRoleById, roleOptions, rowLevelRoleOptions, resourceLabels]);

  return (
    <DataTable
      columns={columns}
      data={roles}
      getRowId={(r) => r.id}
      emptyMessage={tr("noResults")}
    />
  );
}

"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { ChevronDown } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResourceRoleAccessGrid } from "@/components/admin/ResourceRoleAccessGrid";
import { RowLevelRoleRowActions } from "@/components/admin/RowLevelRoleRowActions";
import { RESOURCE_ROLE_ACTIONS, type Resource, type ResourceRole } from "@/config/resource-roles";
import type { ResourceLabelMap } from "@/lib/resource-role-labels";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import { cn } from "@/lib/utils";

const ALL_RESOURCES = Object.keys(RESOURCE_ROLE_ACTIONS) as Resource[];

export interface AdminRowLevelRoleRow {
  id: string;
  name: LocalizedName;
  resourceRoles: ResourceRole[];
  /** How many Roles currently pull this RowLevelRole in (RoleRowLevelRole) — read-only here, the actual assignment happens on the Role side (RoleFormDialog). */
  roleCount: number;
}

interface AdminRowLevelRolesTableProps {
  lang: string;
  rowLevelRoles: AdminRowLevelRoleRow[];
  resourceLabels: ResourceLabelMap;
  /** row-level-roles-edit (or isAdmin) — a view-only holder sees the same rows but no edit controls. */
  canEdit: boolean;
  /** row-level-roles-delete (or isAdmin), independent of canEdit (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canDelete: boolean;
  /** "Create row-level role" icon-button dialog trigger, built by the page — rendered in the table's own toolbar row next to the columns button. */
  createSlot?: ReactNode;
}

/** Collapsed-by-default grants summary, same visual as RoleGrantsPopover but scoped to this table (kept separate rather than generalizing the shared component's Admin.roles-only i18n key). */
function RowLevelRoleGrantsPopover({ lang, resourceRoles, resourceLabels }: { lang: string; resourceRoles: ResourceRole[]; resourceLabels: ResourceLabelMap }) {
  const tr = useTranslations("Admin.rowLevelRoles");
  const [open, setOpen] = useState(false);

  if (resourceRoles.length === 0) return <span className="text-foreground/30">—</span>;

  const granted = new Set(resourceRoles);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-primary transition-colors cursor-pointer"
        >
          <span>{tr("resourceRolesLabel")}</span>
          <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
            {resourceRoles.length}
          </span>
          <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-max max-w-sm p-3 rounded-xl liquid-card border-primary/20" align="start">
        <ResourceRoleAccessGrid
          lang={lang}
          resources={ALL_RESOURCES}
          resourceLabels={resourceLabels}
          isGranted={(role) => granted.has(role)}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Client island for /admin/row-level-roles — see AdminBadgesTable's doc comment for why the columns live here, not in the Server Component page. */
export function AdminRowLevelRolesTable({ lang, rowLevelRoles, resourceLabels, canEdit, canDelete, createSlot }: AdminRowLevelRolesTableProps) {
  const t = useTranslations("Admin");
  const tr = useTranslations("Admin.rowLevelRoles");

  const rowName = useCallback((r: { name: LocalizedName }): string => localizedName(r.name, lang), [lang]);

  const columns = useMemo<ColumnDef<AdminRowLevelRoleRow, unknown>[]>(() => [
    {
      id: "name",
      header: tr("nameLabel"),
      size: 200,
      minSize: 140,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => rowName(row.original),
    },
    {
      id: "grants",
      header: tr("resourceRolesLabel"),
      size: 140,
      minSize: 110,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <RowLevelRoleGrantsPopover lang={lang} resourceRoles={row.original.resourceRoles} resourceLabels={resourceLabels} />
      ),
    },
    {
      id: "usedBy",
      header: tr("usedByColumn"),
      size: 110,
      minSize: 90,
      meta: { headClassName: "text-center align-middle", cellClassName: "text-center align-middle", withRightBorder: true },
      cell: ({ row }) => (
        row.original.roleCount > 0
          ? <span className="text-foreground/70">{row.original.roleCount}</span>
          : <span className="text-foreground/30">—</span>
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
        <RowLevelRoleRowActions
          lang={lang}
          rowLevelRole={row.original}
          resourceLabels={resourceLabels}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ], [lang, canEdit, canDelete, t, tr, rowName, resourceLabels]);

  return (
    <DataTable
      columns={columns}
      data={rowLevelRoles}
      getRowId={(r) => r.id}
      emptyMessage={tr("noResults")}
      toolbarRight={createSlot}
      minRows={8}
      rowHeightClassName="h-[76px]"
      rowHeightPx={76}
      fillViewport
      viewportBottomReservePx={80}
    />
  );
}

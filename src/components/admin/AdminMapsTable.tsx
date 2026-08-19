"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";
import { useAdminTableSort } from "@/hooks/useAdminTableSort";
import { MapRowActions } from "@/components/admin/MapRowActions";
import type { MapServerOption } from "@/components/admin/MapFormDialog";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

export interface AdminMapRow {
  id: string;
  serverId: string;
  name: LocalizedName;
  url: string;
}

interface AdminMapsTableProps {
  lang: string;
  maps: AdminMapRow[];
  servers: MapServerOption[];
  /** maps-edit (or isAdmin) — a maps-view-only holder can reach this page but shouldn't see edit controls. */
  canEdit: boolean;
  /** maps-delete (or isAdmin) — independent of canEdit (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canDelete: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  /** "Create map" icon-button dialog trigger, built by the page — rendered in the table's own toolbar row next to the columns button. */
  createSlot?: ReactNode;
}

/** Client island rendering the /admin/maps table — same DataTable shape every other admin list (badges, ranks, ...) uses, columns built here since a Server Component can't hand a ColumnDef[] (its `cell` entries are closures) across the RSC boundary. */
export function AdminMapsTable({ lang, maps, servers, canEdit, canDelete, sortColumn, sortDirection, createSlot }: AdminMapsTableProps) {
  const t = useTranslations("Admin");
  const tm = useTranslations("Admin.maps");
  const onSort = useAdminTableSort(sortColumn, sortDirection);
  const serverById = useMemo(() => new Map(servers.map((s) => [s.id, s])), [servers]);

  const columns = useMemo<ColumnDef<AdminMapRow, unknown>[]>(() => [
    {
      id: "server",
      header: tm("serverColumn"),
      size: 180,
      minSize: 120,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "server", defaultSortDirection: "asc" },
      cell: ({ row }) => {
        const server = serverById.get(row.original.serverId);
        return (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">{server?.emoji}</span>
            <span className="truncate">{server?.name ?? row.original.serverId}</span>
          </span>
        );
      },
    },
    {
      id: "name",
      header: tm("nameColumn"),
      size: 220,
      minSize: 140,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "name", defaultSortDirection: "asc" },
      cell: ({ row }) => <span className="font-medium text-foreground/90">{localizedName(row.original.name, lang)}</span>,
    },
    {
      id: "url",
      header: tm("urlColumn"),
      size: 360,
      minSize: 160,
      meta: { headClassName: "align-middle", cellClassName: "align-middle whitespace-normal", withRightBorder: true },
      cell: ({ row }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary/70 hover:text-primary hover:underline break-all"
        >
          {row.original.url}
        </a>
      ),
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      size: 100,
      minSize: 76,
      enableHiding: false,
      meta: { headClassName: "align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => <MapRowActions lang={lang} map={row.original} servers={servers} canEdit={canEdit} canDelete={canDelete} />,
    },
  ], [lang, servers, serverById, canEdit, canDelete, t, tm]);

  return (
    <DataTable storageKey="AdminMapsTable" columns={columns}
      data={maps}
      getRowId={(m) => m.id}
      emptyMessage={tm("noResults")}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      toolbarRight={createSlot}
      minRows={8}
      rowHeightClassName="h-[76px]"
      rowHeightPx={76}
      fillViewport
      viewportBottomReservePx={80}
    />
  );
}


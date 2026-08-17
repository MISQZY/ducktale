"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";
import { useAdminTableSort } from "@/hooks/useAdminTableSort";
import { EventRowActions } from "@/components/admin/EventRowActions";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import type { EventServerOption } from "@/components/admin/EventFormDialog";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import type { EventCategory } from "@/config/events";

export interface AdminEventRow {
  id: string;
  serverId: string | null;
  icon: string;
  category: EventCategory;
  name: LocalizedName;
  description: LocalizedName;
  startAt: number;
  endAt: number;
  href: string | null;
}

interface AdminEventsTableProps {
  lang: string;
  events: AdminEventRow[];
  servers: EventServerOption[];
  /** events-edit (or isAdmin) — an events-view-only holder can reach this page but shouldn't see edit controls. */
  canEdit: boolean;
  /** events-delete (or isAdmin) — independent of canEdit (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canDelete: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  /** "Create event" icon-button dialog trigger, built by the page — rendered in the table's own toolbar row next to the columns button. */
  createSlot?: ReactNode;
}

function dateLocale(locale: string): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}

/** Client island rendering the /admin/events table — same DataTable shape every other admin list uses, columns built here since a Server Component can't hand a ColumnDef[] (its `cell` entries are closures) across the RSC boundary. */
export function AdminEventsTable({ lang, events, servers, canEdit, canDelete, sortColumn, sortDirection, createSlot }: AdminEventsTableProps) {
  const t = useTranslations("Admin");
  const te = useTranslations("Admin.events");
  const onSort = useAdminTableSort(sortColumn, sortDirection);
  const serverById = useMemo(() => new Map(servers.map((s) => [s.id, s])), [servers]);

  const formatDate = useMemo(() => {
    const locale = dateLocale(lang);
    return (unixSeconds: number) =>
      new Date(unixSeconds * 1000).toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }, [lang]);

  const columns = useMemo<ColumnDef<AdminEventRow, unknown>[]>(() => [
    {
      id: "name",
      header: te("nameColumn"),
      size: 220,
      minSize: 140,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "name", defaultSortDirection: "asc" },
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground/90">
          <BadgeIcon name={row.original.icon} size={15} className="shrink-0 text-primary/70" />
          <span className="truncate">{localizedName(row.original.name, lang)}</span>
        </span>
      ),
    },
    {
      id: "server",
      header: te("serverColumn"),
      size: 150,
      minSize: 110,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => {
        const server = row.original.serverId ? serverById.get(row.original.serverId) : null;
        return server ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70">
            <span aria-hidden="true">{server.emoji}</span>
            <span className="truncate">{server.name}</span>
          </span>
        ) : (
          <span className="text-xs text-foreground/40">{te("serverNetworkWide")}</span>
        );
      },
    },
    {
      id: "category",
      header: te("categoryColumn"),
      size: 120,
      minSize: 100,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "category", defaultSortDirection: "asc" },
      cell: ({ row }) => <span className="text-xs text-foreground/70">{te(`categories.${row.original.category}`)}</span>,
    },
    {
      id: "period",
      header: te("periodColumn"),
      size: 260,
      minSize: 160,
      meta: { headClassName: "align-middle", cellClassName: "align-middle whitespace-normal", withRightBorder: true, sortKey: "startAt", defaultSortDirection: "asc" },
      cell: ({ row }) => (
        <span className="text-xs text-foreground/70">
          {formatDate(row.original.startAt)} — {formatDate(row.original.endAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      size: 100,
      minSize: 76,
      enableHiding: false,
      meta: { headClassName: "align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => <EventRowActions lang={lang} event={row.original} servers={servers} canEdit={canEdit} canDelete={canDelete} />,
    },
  ], [lang, servers, serverById, canEdit, canDelete, t, te, formatDate]);

  return (
    <DataTable
      columns={columns}
      data={events}
      getRowId={(e) => e.id}
      emptyMessage={te("noResults")}
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

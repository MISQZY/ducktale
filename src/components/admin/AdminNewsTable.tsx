"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";
import { useAdminTableSort } from "@/hooks/useAdminTableSort";
import { NewsRowActions } from "@/components/admin/NewsRowActions";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import type { NewsServerOption } from "@/components/admin/NewsFormDialog";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import type { NewsCategory } from "@/config/news";

export interface AdminNewsRow {
  id: string;
  scope: "site" | "server";
  serverId: string | null;
  icon: string;
  category: NewsCategory;
  title: LocalizedName;
  content: LocalizedName;
  publishedAt: number;
  href: string | null;
}

interface AdminNewsTableProps {
  lang: string;
  news: AdminNewsRow[];
  servers: NewsServerOption[];
  /** news-edit (or isAdmin) — a news-view-only holder can reach this page but shouldn't see edit controls. */
  canEdit: boolean;
  /** news-delete (or isAdmin) — independent of canEdit (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canDelete: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  /** "Create news" icon-button dialog trigger, built by the page — rendered in the table's own toolbar row next to the columns button. */
  createSlot?: ReactNode;
}

function dateLocale(locale: string): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}

/** Client island rendering the /admin/news table — same DataTable shape every other admin list uses, columns built here since a Server Component can't hand a ColumnDef[] (its `cell` entries are closures) across the RSC boundary. */
export function AdminNewsTable({ lang, news, servers, canEdit, canDelete, sortColumn, sortDirection, createSlot }: AdminNewsTableProps) {
  const t = useTranslations("Admin");
  const tn = useTranslations("Admin.news");
  const onSort = useAdminTableSort(sortColumn, sortDirection);
  const serverById = useMemo(() => new Map(servers.map((s) => [s.id, s])), [servers]);

  const formatDate = useMemo(() => {
    const locale = dateLocale(lang);
    return (unixSeconds: number) =>
      new Date(unixSeconds * 1000).toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }, [lang]);

  const columns = useMemo<ColumnDef<AdminNewsRow, unknown>[]>(() => [
    {
      id: "title",
      header: tn("titleColumn"),
      size: 240,
      minSize: 140,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "title", defaultSortDirection: "asc" },
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground/90">
          <BadgeIcon name={row.original.icon} size={15} className="shrink-0 text-primary/70" />
          <span className="truncate">{localizedName(row.original.title, lang)}</span>
        </span>
      ),
    },
    {
      id: "scope",
      header: tn("scopeColumn"),
      size: 150,
      minSize: 110,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => {
        if (row.original.scope === "site") {
          return <span className="text-xs text-foreground/40">{tn("scopeSite")}</span>;
        }
        const server = row.original.serverId ? serverById.get(row.original.serverId) : null;
        return server ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70">
            <span aria-hidden="true">{server.emoji}</span>
            <span className="truncate">{server.name}</span>
          </span>
        ) : (
          <span className="text-xs text-foreground/40">{tn("scopeGeneral")}</span>
        );
      },
    },
    {
      id: "category",
      header: tn("categoryColumn"),
      size: 140,
      minSize: 100,
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true, sortKey: "category", defaultSortDirection: "asc" },
      cell: ({ row }) => <span className="text-xs text-foreground/70">{tn(`categories.${row.original.category}`)}</span>,
    },
    {
      id: "published",
      header: tn("publishedColumn"),
      size: 170,
      minSize: 130,
      meta: { headClassName: "align-middle", cellClassName: "align-middle whitespace-normal", withRightBorder: true, sortKey: "publishedAt", defaultSortDirection: "desc" },
      cell: ({ row }) => <span className="text-xs text-foreground/70">{formatDate(row.original.publishedAt)}</span>,
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      size: 100,
      minSize: 76,
      enableHiding: false,
      meta: { headClassName: "align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => <NewsRowActions lang={lang} news={row.original} servers={servers} canEdit={canEdit} canDelete={canDelete} />,
    },
  ], [lang, servers, serverById, canEdit, canDelete, t, tn, formatDate]);

  return (
    <DataTable storageKey="AdminNewsTable" columns={columns}
      data={news}
      getRowId={(n) => n.id}
      emptyMessage={tn("noResults")}
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

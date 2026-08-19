"use client";

import { useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";
import { useAdminTableSort } from "@/hooks/useAdminTableSort";
import { useAdaptivePageSize } from "@/hooks/useAdaptivePageSize";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge";
import { Link } from "@/i18n/navigation";
import { SERVERS } from "@/config/servers";


export interface AdminApplicationRow {
  id: string;
  applicantName: string;
  serverId: string;
  status: unknown;
  createdAtLabel: string;
  applicantNickname: string;
  skinUrl: string | null;
  isLinked: boolean;
  siteOnline: boolean;
  mcOnline: boolean;
}

interface AdminApplicationsTableProps {
  applications: AdminApplicationRow[];
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  rowOffset?: number;
  /** Search form, built by the page (GET-submit, server-rendered) — rendered in the table's own toolbar row next to the columns button. */
  searchSlot?: ReactNode;
  /** The page's PAGE_SIZE — pads a short page (typically the last one) with blank rows so the table height stays constant across pages. */
  pageSize?: number;
}

/** Client island for /admin/applications — same shape as AdminReportsTable, see that component's doc comment for why the columns live here. */
export function AdminApplicationsTable({ applications, sortColumn, sortDirection, rowOffset, searchSlot, pageSize }: AdminApplicationsTableProps) {
  const tr = useTranslations("Admin.applications");
  const onSort = useAdminTableSort(sortColumn, sortDirection);
  const adaptiveRef = useAdaptivePageSize({ currentPageSize: pageSize ?? 10, rowHeightPx: 76 });

  const columns = useMemo<ColumnDef<AdminApplicationRow, unknown>[]>(() => [
    {
      id: "applicant",
      header: tr("applicantColumn"),
      size: 260,
      minSize: 160,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle whitespace-normal", withRightBorder: true, sortKey: "applicant", defaultSortDirection: "asc" },
      cell: ({ row }) => {
        const application = row.original;
        const serverName = SERVERS.find((s) => s.id === application.serverId)?.name ?? application.serverId;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/applications/${application.id}`}
              className="text-foreground/90 font-medium hover:text-primary/90 hover:underline underline-offset-4 transition-colors"
            >
              {application.applicantName}
            </Link>
            <span className="text-foreground/45 text-xs">{serverName}</span>
          </div>
        );
      },
    },
    {
      id: "submitter",
      header: tr("submitterColumn"),
      size: 150,
      minSize: 100,
      meta: { headClassName: "align-middle text-center", cellClassName: "align-middle text-center", withRightBorder: true },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <PlayerAvatar
            name={row.original.applicantNickname}
            skinUrl={row.original.skinUrl}
            hasSiteProfile={true}
            linked={row.original.isLinked}
            siteOnline={row.original.siteOnline}
            online={row.original.mcOnline}
          />
        </div>
      ),
    },
    {
      id: "status",
      header: tr("statusColumn"),
      size: 160,
      minSize: 110,
      meta: { headClassName: "align-middle text-center", cellClassName: "align-middle text-center", withRightBorder: true, sortKey: "status", defaultSortDirection: "asc" },
      cell: ({ row }) => <ApplicationStatusBadge status={row.original.status} label={tr(`statuses.${row.original.status}`)} />,
    },
    {
      id: "created",
      header: tr("createdColumn"),
      size: 150,
      minSize: 100,
      meta: { headClassName: "align-middle text-center", cellClassName: "align-middle text-center", sortKey: "created", defaultSortDirection: "desc" },
      cell: ({ row }) => <span className="text-foreground/50 text-xs">{row.original.createdAtLabel}</span>,
    },
  ], [tr]);

  return (
    <div ref={adaptiveRef}>
      <DataTable storageKey="AdminApplicationsTable" columns={columns}
        data={applications}
        getRowId={(a) => a.id}
        emptyMessage={tr("noResults")}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        rowOffset={rowOffset}
        toolbarLeft={searchSlot}
        minRows={pageSize}
        rowHeightClassName="h-[76px]"
      />
    </div>
  );
}


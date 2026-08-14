"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { Paperclip } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { Link } from "@/i18n/navigation";
import type { TicketStatus } from ".prisma/site-client";

export interface AdminTicketRow {
  id: string;
  subject: string;
  status: TicketStatus;
  messageCount: number;
  attachmentCount: number;
  updatedAtLabel: string;
  createdAtLabel: string;
  userNickname: string;
  skinUrl: string | null;
  isLinked: boolean;
  siteOnline: boolean;
  mcOnline: boolean;
}

interface AdminTicketsTableProps {
  tickets: AdminTicketRow[];
}

/** Client island for /admin/tickets — see AdminBadgesTable's doc comment for why the columns live here. siteOnline/mcOnline are pre-computed server-side (isUserOnline reads an in-memory Map that only exists in the Node process). */
export function AdminTicketsTable({ tickets }: AdminTicketsTableProps) {
  const tt = useTranslations("Tickets");

  const columns = useMemo<ColumnDef<AdminTicketRow, unknown>[]>(() => [
    {
      id: "ticket",
      header: tt("ticketColumn"),
      meta: { headClassName: "w-[40%] align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div className="flex flex-col gap-1">
            <Link
              href={`/tickets/${ticket.id}`}
              className="text-foreground/90 font-medium hover:text-primary/90 hover:underline underline-offset-4 transition-colors"
            >
              {ticket.subject}
            </Link>
            <span className="flex items-center gap-1.5 text-foreground/45 text-xs">
              {tt("messageCount", { count: ticket.messageCount })}
              {ticket.attachmentCount > 0 && (
                <>
                  <span aria-hidden="true">•</span>
                  <span className="flex items-center gap-1">
                    <Paperclip size={11} className="shrink-0" />
                    {tt("attachmentCount", { count: ticket.attachmentCount })}
                  </span>
                </>
              )}
            </span>
          </div>
        );
      },
    },
    {
      id: "initiator",
      header: tt("initiatorColumn"),
      meta: { headClassName: "w-[150px] align-middle text-center", cellClassName: "align-middle text-center", withRightBorder: true },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <PlayerAvatar
            name={row.original.userNickname}
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
      header: tt("statusColumn"),
      meta: { headClassName: "w-[180px] align-middle text-center", cellClassName: "align-middle text-center", withRightBorder: true },
      cell: ({ row }) => <TicketStatusBadge status={row.original.status} label={tt(`status.${row.original.status}`)} />,
    },
    {
      id: "updated",
      header: tt("updatedColumn"),
      meta: { headClassName: "w-[180px] align-middle text-center", cellClassName: "align-middle text-center", withRightBorder: true },
      cell: ({ row }) => <span className="text-foreground/50 text-xs">{row.original.updatedAtLabel}</span>,
    },
    {
      id: "created",
      header: tt("createdColumn"),
      meta: { headClassName: "w-[180px] align-middle text-center", cellClassName: "align-middle text-center" },
      cell: ({ row }) => <span className="text-foreground/50 text-xs">{row.original.createdAtLabel}</span>,
    },
  ], [tt]);

  return <DataTable columns={columns} data={tickets} getRowId={(t) => t.id} emptyMessage={tt("noTickets")} />;
}

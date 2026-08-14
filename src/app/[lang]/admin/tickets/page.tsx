import { getTranslations } from "next-intl/server";
import { Paperclip } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { isUserOnline } from "@/lib/presence";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
import { ServerPagination } from "@/components/common/ServerPagination";
import type { TicketStatus } from ".prisma/site-client";

const PAGE_SIZE = 10;
const STATUS_FILTERS = ["ALL", "OPEN", "ANSWERED", "CLOSED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default async function AdminTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const { lang } = await params;
  await requireAdmin(lang);
  const { search: rawSearch, status: rawStatus, page: rawPage } = await searchParams;

  const search = rawSearch?.trim() ?? "";
  const status: StatusFilter = STATUS_FILTERS.includes(rawStatus as StatusFilter)
    ? (rawStatus as StatusFilter)
    : "ALL";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const t = await getTranslations("Admin");
  const tt = await getTranslations("Tickets");

  const where = {
    ...(status !== "ALL" ? { status: status as TicketStatus } : {}),
    ...(search
      ? {
          OR: [
            { subject: { contains: search } },
            { user: { nickname: { contains: search } } },
          ],
        }
      : {}),
  };

  const [tickets, total] = await Promise.all([
    siteDb.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        subject: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        user: { select: { id: true, nickname: true, accountLink: { select: { status: true, minecraftUuid: true, minecraftName: true } } } },
        _count: { select: { messages: true } },
        messages: { select: { _count: { select: { attachments: true } } } },
      },
    }),
    siteDb.ticket.count({ where }),
  ]);

  const { resolveSkinUrl } = await import("@/lib/skin");
  const skinUrls: (string | null)[] = [];
  const chunkSize = 3;
  for (let i = 0; i < tickets.length; i += chunkSize) {
    const chunk = tickets.slice(i, i + chunkSize);
    const chunkSkins = await Promise.all(
      chunk.map((t) => t.user.accountLink?.minecraftUuid ? resolveSkinUrl(t.user.accountLink.minecraftUuid) : Promise.resolve(null))
    );
    skinUrls.push(...chunkSkins);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseQuery = { ...(search ? { search } : {}), ...(status !== "ALL" ? { status } : {}) };

  const { getAllOnlinePlayers } = await import("@/lib/players");
  const onlinePlayers = await getAllOnlinePlayers();
  const onlineMcNames = new Set(onlinePlayers.map(p => p.name.toLowerCase()));

  return (
    <AdminPageShell title={t("ticketsTitle")} description={t("ticketsDescription", { count: total })} active="tickets">
      <div className="w-full">
        <form className="mb-4 flex justify-center">
          <SearchInput
            name="search"
            defaultValue={search}
            placeholder={tt("adminSearchPlaceholder")}
            wrapperClassName="max-w-sm"
          />
        </form>

        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={{ pathname: "/admin/tickets", query: { ...(search ? { search } : {}), ...(s !== "ALL" ? { status: s } : {}) } }}
              className={cn(
                "px-3 py-1 rounded-full text-[0.65rem] uppercase tracking-widest border transition-colors",
                status === s
                  ? "border-primary/40 bg-primary/10 text-primary/90"
                  : "border-primary/15 text-foreground/45 hover:text-foreground/70 hover:border-primary/30"
              )}
            >
              {s === "ALL" ? tt("statusAll") : tt(`status.${s}`)}
            </Link>
          ))}
        </div>

        <div className="min-h-[42vh]">
          <DocsTable>
            <DocsTableHeader>
              <DocsTableRow>
                <DocsTableHead className="w-[40%] align-middle" withRightBorder>{tt("ticketColumn")}</DocsTableHead>
                <DocsTableHead className="w-[150px] align-middle text-center" withRightBorder>{tt("initiatorColumn")}</DocsTableHead>
                <DocsTableHead className="w-[180px] align-middle text-center" withRightBorder>{tt("statusColumn")}</DocsTableHead>
                <DocsTableHead className="w-[180px] align-middle text-center" withRightBorder>{tt("updatedColumn")}</DocsTableHead>
                <DocsTableHead className="w-[180px] align-middle text-center">{tt("createdColumn")}</DocsTableHead>
              </DocsTableRow>
            </DocsTableHeader>
            <DocsTableBody className="[&_tr:last-child]:border-0">
              {tickets.length === 0 ? (
                <DocsTableRow>
                  <DocsTableCell colSpan={5} className="text-center py-10">
                    <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>{tt("noTickets")}</p>
                  </DocsTableCell>
                </DocsTableRow>
              ) : (
                tickets.map((ticket, i) => {
                  const mcOnline = ticket.user.accountLink?.minecraftName ? onlineMcNames.has(ticket.user.accountLink.minecraftName.toLowerCase()) : false;
                  const attachmentCount = ticket.messages.reduce((sum, m) => sum + m._count.attachments, 0);
                  return (
                  <DocsTableRow key={ticket.id}>
                    <DocsTableCell className="align-middle" withRightBorder>
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-foreground/90 font-medium hover:text-primary/90 hover:underline underline-offset-4 transition-colors"
                        >
                          {ticket.subject}
                        </Link>
                        <span className="flex items-center gap-1.5 text-foreground/45 text-xs">
                          {tt("messageCount", { count: ticket._count.messages })}
                          {attachmentCount > 0 && (
                            <>
                              <span aria-hidden="true">•</span>
                              <span className="flex items-center gap-1">
                                <Paperclip size={11} className="shrink-0" />
                                {tt("attachmentCount", { count: attachmentCount })}
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    </DocsTableCell>

                    <DocsTableCell className="align-middle text-center" withRightBorder>
                      <div className="flex justify-center">
                        <PlayerAvatar
                          name={ticket.user.nickname}
                          skinUrl={skinUrls[i]}
                          hasSiteProfile={true}
                          linked={ticket.user.accountLink?.status === "CONFIRMED"}
                          siteOnline={isUserOnline(ticket.user.id)}
                          online={mcOnline}
                        />
                      </div>
                    </DocsTableCell>

                    <DocsTableCell className="align-middle text-center" withRightBorder>
                      <TicketStatusBadge status={ticket.status} label={tt(`status.${ticket.status}`)} />
                    </DocsTableCell>

                    <DocsTableCell className="align-middle text-center" withRightBorder>
                      <span className="text-foreground/50 text-xs">
                        {ticket.updatedAt.toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}
                      </span>
                    </DocsTableCell>

                    <DocsTableCell className="align-middle text-center">
                      <span className="text-foreground/50 text-xs">
                        {ticket.createdAt.toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}
                      </span>
                    </DocsTableCell>
                  </DocsTableRow>
                  );
                })
              )}
            </DocsTableBody>
          </DocsTable>
        </div>

        <ServerPagination
          page={page}
          totalPages={totalPages}
          pathname="/admin/tickets"
          buildQuery={(p) => ({ ...baseQuery, page: String(p) })}
          prevText={t("prevPage")}
          nextText={t("nextPage")}
        />
      </div>
    </AdminPageShell>
  );
}

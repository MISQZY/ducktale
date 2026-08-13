import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
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
        user: { select: { nickname: true } },
        _count: { select: { messages: true } },
      },
    }),
    siteDb.ticket.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseQuery = { ...(search ? { search } : {}), ...(status !== "ALL" ? { status } : {}) };

  return (
    <AdminPageShell title={t("ticketsTitle")} description={t("ticketsDescription", { count: total })} active="tickets">
      <div className="w-full">
        <form className="mb-4 flex justify-center">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder={tt("adminSearchPlaceholder")}
            className="w-full max-w-sm rounded-xl border border-primary/20 bg-card/50 px-4 py-2 text-sm text-foreground/90 focus:outline-none focus:border-primary/50"
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
                tickets.map((ticket) => (
                  <DocsTableRow key={ticket.id}>
                    <DocsTableCell className="align-middle" withRightBorder>
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-foreground/90 font-medium hover:text-primary/90 hover:underline underline-offset-4 transition-colors"
                        >
                          {ticket.subject}
                        </Link>
                        <span className="text-foreground/45 text-xs">
                          {tt("messageCount", { count: ticket._count.messages })}
                        </span>
                      </div>
                    </DocsTableCell>

                    <DocsTableCell className="align-middle text-center" withRightBorder>
                      <Link
                        href={`/profile/${encodeURIComponent(ticket.user.nickname)}`}
                        target="_blank"
                        className="text-foreground/80 text-sm font-medium hover:text-primary/90 hover:underline underline-offset-4 transition-colors"
                      >
                        {ticket.user.nickname}
                      </Link>
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
                ))
              )}
            </DocsTableBody>
          </DocsTable>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link
              href={{ pathname: "/admin/tickets", query: { ...baseQuery, page: String(Math.max(1, page - 1)) } }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs border border-primary/20 text-foreground/60 hover:text-foreground hover:border-primary/40 transition-colors",
                page <= 1 && "pointer-events-none opacity-30"
              )}
            >
              {t("prevPage")}
            </Link>
            <span className="text-xs text-foreground/50 tabular-nums">{t("pageInfo", { page, totalPages })}</span>
            <Link
              href={{ pathname: "/admin/tickets", query: { ...baseQuery, page: String(Math.min(totalPages, page + 1)) } }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs border border-primary/20 text-foreground/60 hover:text-foreground hover:border-primary/40 transition-colors",
                page >= totalPages && "pointer-events-none opacity-30"
              )}
            >
              {t("nextPage")}
            </Link>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}

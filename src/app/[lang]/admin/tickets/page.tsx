import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
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
      <div className="max-w-2xl mx-auto">
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

        <div className="space-y-4 min-h-[42vh]">
          {tickets.length === 0 ? (
            <p className="rounded-2xl border border-primary/20 bg-card/50 p-10 text-center text-foreground/40 text-sm">
              {tt("noTickets")}
            </p>
          ) : (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="corner-ornament block rounded-2xl border border-primary/20 bg-card/50 p-5 relative overflow-hidden hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                  <span className="text-foreground/90 font-medium">{ticket.subject}</span>
                  <TicketStatusBadge status={ticket.status} label={tt(`status.${ticket.status}`)} />
                </div>
                <p className="text-foreground/45 text-xs">
                  {tt("openedBy", { nickname: ticket.user.nickname })} · {tt("messageCount", { count: ticket._count.messages })}
                </p>
                <p className="text-foreground/40 text-xs mt-0.5">
                  {tt("updatedAt", { date: ticket.updatedAt.toLocaleString(lang === "ru" ? "ru-RU" : "en-US") })}
                </p>
              </Link>
            ))
          )}
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

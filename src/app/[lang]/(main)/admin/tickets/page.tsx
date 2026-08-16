import { getTranslations } from "next-intl/server";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminTicketsTable } from "@/components/admin/AdminTicketsTable";
import { isUserOnline } from "@/lib/presence";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { TablePagination } from "@/components/docs/paged-table/TablePagination";
import { resolvePageSize } from "@/lib/pagination";
import type { Prisma, TicketStatus } from ".prisma/site-client";

// Default/fallback only — useAdaptivePageSize (client-side, in
// AdminTicketsTable) overrides this via ?pageSize= to whatever count
// actually fills the viewport, so this is just what a fresh, JS-less first
// load uses.
const DEFAULT_PAGE_SIZE = 10;
const STATUS_FILTERS = ["ALL", "OPEN", "ANSWERED", "CLOSED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// Allowlist, not a raw column passthrough — searchParams are user input.
const SORTABLE = {
  ticket: "subject",
  status: "status",
  updated: "updatedAt",
  created: "createdAt",
} as const satisfies Record<string, keyof Prisma.TicketOrderByWithRelationInput>;

export default async function AdminTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string; sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  await requireResourceRole(lang, "tickets-view");
  const navAccess = await getAdminNavAccess();
  const { search: rawSearch, status: rawStatus, page: rawPage, pageSize: rawPageSize, sort: rawSort, order: rawOrder } = await searchParams;

  const search = rawSearch?.trim() ?? "";
  const status: StatusFilter = STATUS_FILTERS.includes(rawStatus as StatusFilter)
    ? (rawStatus as StatusFilter)
    : "ALL";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const PAGE_SIZE = resolvePageSize(rawPageSize, DEFAULT_PAGE_SIZE);
  const sortDir: "asc" | "desc" = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : "desc";
  const sortKey = (rawSort && rawSort in SORTABLE ? rawSort : "updated") as keyof typeof SORTABLE;
  const orderBy: Prisma.TicketOrderByWithRelationInput = { [SORTABLE[sortKey]]: sortDir };

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
      orderBy,
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

  const { resolveSkinUrls } = await import("@/lib/skin");
  const skinUrls = await resolveSkinUrls(tickets.map((t) => t.user.accountLink?.minecraftUuid));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const dateLocale = lang === "ru" ? "ru-RU" : "en-US";

  const baseQuery = {
    ...(search ? { search } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(rawSort && rawSort in SORTABLE ? { sort: sortKey, order: sortDir } : {}),
    ...(rawPageSize ? { pageSize: String(PAGE_SIZE) } : {}),
  };

  const { getAllOnlinePlayers } = await import("@/lib/players");
  const onlinePlayers = await getAllOnlinePlayers();
  const onlineMcNames = new Set(onlinePlayers.map(p => p.name.toLowerCase()));

  const ticketRows = tickets.map((ticket, i) => ({
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    messageCount: ticket._count.messages,
    attachmentCount: ticket.messages.reduce((sum, m) => sum + m._count.attachments, 0),
    updatedAtLabel: ticket.updatedAt.toLocaleString(dateLocale),
    createdAtLabel: ticket.createdAt.toLocaleString(dateLocale),
    userNickname: ticket.user.nickname,
    skinUrl: skinUrls[i],
    isLinked: ticket.user.accountLink?.status === "CONFIRMED",
    siteOnline: isUserOnline(ticket.user.id),
    mcOnline: ticket.user.accountLink?.minecraftName ? onlineMcNames.has(ticket.user.accountLink.minecraftName.toLowerCase()) : false,
  }));

  const searchSlot = (
    <form className="w-full max-w-xs">
      <SearchInput name="search" defaultValue={search} placeholder={tt("adminSearchPlaceholder")} />
    </form>
  );

  return (
    <AdminPageShell title={t("ticketsTitle")} description={t("ticketsDescription", { count: total })} active="tickets" navAccess={navAccess}>
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={{
                pathname: "/admin/tickets",
                query: {
                  ...(search ? { search } : {}),
                  ...(rawSort && rawSort in SORTABLE ? { sort: sortKey, order: sortDir } : {}),
                  ...(rawPageSize ? { pageSize: String(PAGE_SIZE) } : {}),
                  ...(s !== "ALL" ? { status: s } : {}),
                },
              }}
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

        <AdminTicketsTable tickets={ticketRows} sortColumn={sortKey} sortDirection={sortDir} rowOffset={(page - 1) * PAGE_SIZE} searchSlot={searchSlot} pageSize={PAGE_SIZE} />

        <div className="mt-6">
          <TablePagination
            page={page}
            totalPages={totalPages}
            pageStart={(page - 1) * PAGE_SIZE}
            pageSize={PAGE_SIZE}
            total={total}
            hrefBase={{ pathname: "/admin/tickets", query: baseQuery }}
          />
        </div>
      </div>
    </AdminPageShell>
  );
}

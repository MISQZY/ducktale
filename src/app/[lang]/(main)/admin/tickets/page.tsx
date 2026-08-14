import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminTicketsTable } from "@/components/admin/AdminTicketsTable";
import { isUserOnline } from "@/lib/presence";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
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

  const { resolveSkinUrls } = await import("@/lib/skin");
  const skinUrls = await resolveSkinUrls(tickets.map((t) => t.user.accountLink?.minecraftUuid));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const dateLocale = lang === "ru" ? "ru-RU" : "en-US";

  const baseQuery = { ...(search ? { search } : {}), ...(status !== "ALL" ? { status } : {}) };

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
          <AdminTicketsTable tickets={ticketRows} />
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

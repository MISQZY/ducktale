import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Paperclip } from "lucide-react";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import Navbar from "@/components/Navbar";
import { GoldDivider } from "@/components/common/GoldDivider";
import { CtaButton } from "@/components/common/CtaButton";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { Link } from "@/i18n/navigation";

import { ServerPagination } from "@/components/common/ServerPagination";

const PAGE_SIZE = 10;

export default async function MyTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  const { page: rawPage } = await searchParams;
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const t = await getTranslations("Tickets");

  const [tickets, total] = await Promise.all([
    siteDb.ticket.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        subject: true,
        status: true,
        updatedAt: true,
        messages: { select: { _count: { select: { attachments: true } } } },
      },
    }),
    siteDb.ticket.count({ where: { userId: session.user.id } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-16">
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
            <h1 className="text-3xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
              {t("myTicketsTitle")}
            </h1>
            <CtaButton href={`/${lang}/account/tickets/new`} className="px-5 py-2 text-xs">
              {t("newTicket")}
            </CtaButton>
          </div>
          <p className="text-foreground/60 mb-6">{t("myTicketsDescription")}</p>

          <GoldDivider className="mb-8" />

          <div className="space-y-4 min-h-[30vh]">
            {tickets.length === 0 ? (
              <p className="rounded-2xl border border-primary/20 bg-card/50 p-10 text-center text-foreground/40 text-sm">
                {t("noTickets")}
              </p>
            ) : (
              tickets.map((ticket) => {
                const attachmentCount = ticket.messages.reduce((sum, m) => sum + m._count.attachments, 0);
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="corner-ornament block rounded-2xl border border-primary/20 bg-card/50 p-5 relative overflow-hidden hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                      <span className="text-foreground/90 font-medium">{ticket.subject}</span>
                      <TicketStatusBadge status={ticket.status} label={t(`status.${ticket.status}`)} />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-foreground/40 text-xs">
                        {t("updatedAt", { date: ticket.updatedAt.toLocaleString(lang === "ru" ? "ru-RU" : "en-US") })}
                      </p>
                      {attachmentCount > 0 && (
                        <span className="flex items-center gap-1 text-foreground/40 text-xs">
                          <Paperclip size={11} className="shrink-0" />
                          {t("attachmentCount", { count: attachmentCount })}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <ServerPagination
            page={page}
            totalPages={totalPages}
            pathname="/account/tickets"
            buildQuery={(p) => ({ page: String(p) })}
            prevText={t("prevPage")}
            nextText={t("nextPage")}
          />
        </div>
      </main>
    </>
  );
}

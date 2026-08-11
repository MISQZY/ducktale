import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTicketViewer, canViewTicket } from "@/lib/tickets";
import { siteDb } from "@/lib/site-db";
import Navbar from "@/components/Navbar";
import { GoldDivider } from "@/components/common/GoldDivider";
import { TicketThread } from "@/components/tickets/TicketThread";
import { Link } from "@/i18n/navigation";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const viewer = await getTicketViewer();
  if (!viewer) redirect(`/${lang}/account/login`);

  const ticket = await siteDb.ticket.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      status: true,
      userId: true,
      user: { select: { nickname: true } },
    },
  });

  // Same outcome (404) whether the ticket doesn't exist or just isn't this
  // viewer's to see — doesn't confirm a ticket ID exists to an unauthorized visitor.
  if (!ticket || !canViewTicket(viewer, ticket)) notFound();

  const messages = await siteDb.ticketMessage.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      isAdminReply: true,
      createdAt: true,
      author: { select: { nickname: true } },
      attachments: {
        select: {
          id: true,
          filename: true,
          size: true,
          mimeType: true,
        }
      }
    },
  });

  const t = await getTranslations("Tickets");
  const isOwner = ticket.userId === viewer.id;
  const backHref = viewer.isAdmin && !isOwner ? `/admin/tickets` : `/account/tickets`;

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-16">
        <div className="relative z-10 max-w-2xl mx-auto">
          <Link href={backHref} className="text-xs text-foreground/45 hover:text-foreground/70 transition-colors mb-4 inline-block">
            {t("backToList")}
          </Link>

          <h1 className="text-2xl text-primary/90 leading-tight mb-1" style={{ fontFamily: "var(--font-body)" }}>
            {ticket.subject}
          </h1>
          {viewer.isAdmin && !isOwner && (
            <p className="text-foreground/40 text-xs mb-4">{t("openedBy", { nickname: ticket.user.nickname })}</p>
          )}

          <GoldDivider className="mb-6" />

          <TicketThread
            lang={lang}
            ticketId={ticket.id}
            initialStatus={ticket.status}
            initialMessages={messages.map((m) => ({
              id: m.id,
              body: m.body,
              isAdminReply: m.isAdminReply,
              createdAt: m.createdAt.toISOString(),
              authorNickname: m.author.nickname,
              attachments: m.attachments,
            }))}
            isAdmin={viewer.isAdmin}
          />
        </div>
      </main>
    </>
  );
}

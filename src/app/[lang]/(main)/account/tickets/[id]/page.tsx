import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTicketViewer, canViewTicket, isTicketStaff, isTicketEditor, isTicketDeleter } from "@/lib/tickets";
import { siteDb } from "@/lib/site-db";
import { TicketThread } from "@/components/tickets/TicketThread";
import { Link } from "@/i18n/navigation";
import { resolveTicketMessages } from "@/lib/ticket-data";

export default async function AccountTicketViewerPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const viewer = await getTicketViewer();
  if (!viewer) redirect(`/${lang}/account/login`);

  const isStaff = isTicketStaff(viewer);

  const [ticket, messages] = await Promise.all([
    siteDb.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        status: true,
        userId: true,
        user: {
          select: {
            nickname: true,
          }
        },
      },
    }),
    resolveTicketMessages(id, isStaff),
  ]);

  if (!ticket || !canViewTicket(viewer, ticket)) notFound();

  const isOwner = ticket.userId === viewer.id;
  const canEdit = isTicketEditor(viewer);
  const canDelete = isTicketDeleter(viewer);

  const t = await getTranslations("Tickets");
  const backHref = `/account/tickets`;

  return (
    <>
      <Link href={backHref} className="text-xs text-foreground/45 hover:text-foreground/70 transition-colors mb-4 inline-block shrink-0 lg:hidden">
        {t("backToList")}
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-4 shrink-0">
        <h1 className="text-2xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
          {ticket.subject}
        </h1>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <TicketThread
          lang={lang}
          ticketId={ticket.id}
          subject={ticket.subject}
          backHref={backHref}
          initialStatus={ticket.status}
          initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
          viewerId={viewer.id}
          isStaff={isStaff}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>
    </>
  );
}

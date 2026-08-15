import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTicketViewer, canViewTicket } from "@/lib/tickets";
import { siteDb } from "@/lib/site-db";
import { TicketThread } from "@/components/tickets/TicketThread";
import { Link } from "@/i18n/navigation";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { CompactBadgeChip } from "@/components/badges/CompactBadgeChip";
import { getPlayerCard } from "@/lib/player-card";

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
      user: { 
        select: { 
          nickname: true,
          accountLink: {
            select: { status: true, minecraftName: true }
          },
          badges: {
            select: {
              badge: {
                select: { name: true, icon: true, color: true, description: true, earnCondition: true }
              }
            }
          }
        } 
      },
    },
  });

  // Same outcome (404) whether the ticket doesn't exist or just isn't this
  // viewer's to see — doesn't confirm a ticket ID exists to an unauthorized visitor.
  if (!ticket || !canViewTicket(viewer, ticket)) notFound();

  const isOwner = ticket.userId === viewer.id;

  // Only ever rendered inside the viewer.isAdmin && !isOwner block below —
  // skip the (multi-query + external skin fetch) getPlayerCard() call
  // entirely for the common case of a user viewing their own ticket.
  let playerCard = null;
  if (viewer.isAdmin && !isOwner && ticket.user.accountLink?.status === "CONFIRMED" && ticket.user.accountLink.minecraftName) {
    playerCard = await getPlayerCard(ticket.user.accountLink.minecraftName);
  }

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
  const backHref = viewer.isAdmin && !isOwner ? `/admin/tickets` : `/account/tickets`;

  return (
    <>
      {/* h-dvh, not h-screen: 100vh on mobile Chrome/Safari measures the
          viewport as if the address bar were hidden, so a flex-col layout
          pinned to that height gets its bottom edge (the reply box here)
          pushed behind the browser's own UI chrome whenever it's visible.
          dvh tracks the actual visible height instead. */}
      <main className="relative overflow-hidden h-dvh flex flex-col px-6 pt-24 pb-8">
        <div className="relative z-10 max-w-2xl mx-auto w-full flex-1 flex flex-col min-h-0">
          <Link href={backHref} className="text-xs text-foreground/45 hover:text-foreground/70 transition-colors mb-4 inline-block shrink-0">
            {t("backToList")}
          </Link>

          <div className="flex items-center justify-between gap-4 flex-wrap mb-4 shrink-0">
            <h1 className="text-2xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
              {ticket.subject}
            </h1>
            {viewer.isAdmin && !isOwner && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/45">{t("initiatorLabel")}</span>
                {ticket.user.accountLink?.status === "CONFIRMED" && ticket.user.accountLink.minecraftName && playerCard ? (
                  <PlayerAvatar
                    name={ticket.user.nickname}
                    skinUrl={playerCard.skinUrl}
                    hasSiteProfile={true}
                    linked={true}
                    online={playerCard.online}
                    siteOnline={playerCard.siteOnline}
                    appendNode={
                      ticket.user.badges.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {ticket.user.badges.slice(0, 3).map((b) => (
                            <CompactBadgeChip
                              key={b.badge.name}
                              name={b.badge.name}
                              icon={b.badge.icon}
                              color={b.badge.color}
                              description={b.badge.description}
                              earnCondition={b.badge.earnCondition}
                              size={15}
                            />
                          ))}
                          {ticket.user.badges.length > 3 && (
                            <span
                              className="text-[0.65rem] text-foreground/40 shrink-0"
                              title={ticket.user.badges.slice(3).map((b) => b.badge.name).join(", ")}
                            >
                              +{ticket.user.badges.length - 3}
                            </span>
                          )}
                        </div>
                      ) : null
                    }
                  />
                ) : (
                  <Link
                    href={`/profile/${encodeURIComponent(ticket.user.nickname)}`}
                    target="_blank"
                    className="text-foreground/80 font-medium hover:text-primary hover:underline underline-offset-4 transition-colors text-sm"
                  >
                    {ticket.user.nickname}
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <TicketThread
              lang={lang}
              ticketId={ticket.id}
              subject={ticket.subject}
              backHref={backHref}
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
        </div>
      </main>
    </>
  );
}

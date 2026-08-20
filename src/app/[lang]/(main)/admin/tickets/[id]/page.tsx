import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getTicketViewer, canViewTicket, isTicketStaff, isTicketEditor, isTicketDeleter } from "@/lib/tickets";
import { siteDb } from "@/lib/site-db";
import { TicketThread } from "@/components/tickets/TicketThread";
import { Link } from "@/i18n/navigation";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { CompactBadgeChip } from "@/components/badges/CompactBadgeChip";

import { resolveSkinUrl } from "@/lib/skin";
import { resolveTicketMessages } from "@/lib/ticket-data";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const viewer = await getTicketViewer();
  if (!viewer) redirect(`/${lang}/account/login`);

  // isTicketStaff only depends on the viewer, not the ticket record, so it
  // can be computed up front and resolveTicketMessages run alongside the
  // ticket query instead of after it — an avoidable serial DB round trip.
  // Safe to fetch before the canViewTicket check below: an unauthorized
  // viewer still gets notFound() before anything is rendered, this only
  // avoids wasting the round trip on the (common) authorized path.
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
            accountLink: {
              select: { status: true, minecraftName: true, minecraftUuid: true }
            },
            badges: {
              select: {
                badge: {
                  select: { id: true, name: true, icon: true, color: true, description: true, earnCondition: true }
                }
              }
            }
          }
        },
      },
    }),
    resolveTicketMessages(id, isStaff),
  ]);

  // Same outcome (404) whether the ticket doesn't exist or just isn't this
  // viewer's to see — doesn't confirm a ticket ID exists to an unauthorized visitor.
  if (!ticket || !canViewTicket(viewer, ticket)) notFound();

  const isOwner = ticket.userId === viewer.id;
  const canEdit = isTicketEditor(viewer);
  const canDelete = isTicketDeleter(viewer);

  // Only ever rendered inside the isStaff && !isOwner block below — skip the
  // (multi-query + external skin fetch) getPlayerCard() call entirely for
  // the common case of a user viewing their own ticket.
  let authorSkinUrl = null;
  if (isStaff && !isOwner && ticket.user.accountLink?.status === "CONFIRMED" && ticket.user.accountLink.minecraftUuid) {
    authorSkinUrl = await resolveSkinUrl(ticket.user.accountLink.minecraftUuid);
  }

  const t = await getTranslations("Tickets");
  const backHref = `/admin/tickets`;

  return (
    <>
      
      <div className="w-full flex-1 flex flex-col min-h-0">


          <div className="flex items-center justify-between gap-4 flex-wrap mb-4 shrink-0">
            <h1 className="text-2xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
              {ticket.subject}
            </h1>
            {isStaff && !isOwner && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/45">{t("initiatorLabel")}</span>
                {ticket.user.accountLink?.status === "CONFIRMED" ? (
                  <PlayerAvatar
                    name={ticket.user.nickname}
                    skinUrl={authorSkinUrl}
                    hasSiteProfile={true}
                    linked={true}
                                        appendNode={
                      ticket.user.badges.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {ticket.user.badges.slice(0, 3).map((b) => (
                            <CompactBadgeChip
                              key={b.badge.id}
                              name={localizedName(b.badge.name as unknown as LocalizedName, lang)}
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
                              title={ticket.user.badges.slice(3).map((b) => localizedName(b.badge.name as unknown as LocalizedName, lang)).join(", ")}
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
              initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
              viewerId={viewer.id}
              isStaff={isStaff}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </div>
        </div>
    </>
  );
}

// fix hmr
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getApplicationViewer, canViewApplication, isApplicationStaff, isApplicationEditor, isApplicationDeleter } from "@/lib/applications";
import { siteDb } from "@/lib/site-db";
import { ApplicationThread } from "@/components/applications/ApplicationThread";
import { Link } from "@/i18n/navigation";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { CompactBadgeChip } from "@/components/badges/CompactBadgeChip";
import { getPlayerCard } from "@/lib/player-card";
import { resolveApplicationMessages } from "@/lib/application-data";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import { SERVERS } from "@/config/servers";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const viewer = await getApplicationViewer();
  if (!viewer) redirect(`/${lang}/account/login`);

  const isStaff = isApplicationStaff(viewer);

  const [application, messages] = await Promise.all([
    siteDb.application.findUnique({
      where: { id },
      select: {
        id: true,
        applicantName: true,
        serverId: true,
        status: true,
        applicantId: true,
        applicant: {
          select: {
            nickname: true,
            accountLink: {
              select: { status: true, minecraftName: true },
            },
            badges: {
              select: {
                badge: {
                  select: { id: true, name: true, icon: true, color: true, description: true, earnCondition: true },
                },
              },
            },
          },
        },
      },
    }),
    resolveApplicationMessages(id, isStaff),
  ]);

  // Same outcome (404) whether the application doesn't exist or just isn't
  // this viewer's to see — doesn't confirm an application ID exists to an
  // unauthorized visitor.
  if (!application || !canViewApplication(viewer, application)) notFound();

  const isOwner = application.applicantId === viewer.id;
  const canEdit = isApplicationEditor(viewer);
  const canDelete = isApplicationDeleter(viewer);

  // Unlike Report/Ticket, the author's site profile is shown regardless of
  // isStaff/isOwner — applicantName (the "Объект обращения" nickname) may
  // name someone other than the filer, so who actually submitted it is
  // always worth surfacing, not just to staff reviewing someone else's case.
  let playerCard = null;
  if (application.applicant.accountLink?.status === "CONFIRMED" && application.applicant.accountLink.minecraftName) {
    playerCard = await getPlayerCard(application.applicant.accountLink.minecraftName);
  }

  const t = await getTranslations("Applications");
  const backHref = isStaff && !isOwner ? `/admin/applications` : `/account/applications`;
  const serverName = SERVERS.find((s) => s.id === application.serverId)?.name ?? application.serverId;

  return (
    <main className="relative overflow-hidden h-dvh flex flex-col px-6 pt-24 pb-8">
      <div className="relative z-10 max-w-2xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <Link href={backHref} className="text-xs text-foreground/45 hover:text-foreground/70 transition-colors mb-4 inline-block shrink-0">
          {t("backToList")}
        </Link>

        <div className="flex items-center justify-between gap-4 flex-wrap mb-1 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-foreground/45">{t("applicantLabel")}</span>
            <h1 className="text-2xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
              {application.applicantName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/45">{t("submittedByLabel")}</span>
            {application.applicant.accountLink?.status === "CONFIRMED" && application.applicant.accountLink.minecraftName && playerCard ? (
              <PlayerAvatar
                name={application.applicant.nickname}
                skinUrl={playerCard.skinUrl}
                hasSiteProfile={true}
                linked={true}
                online={playerCard.online}
                siteOnline={playerCard.siteOnline}
                appendNode={
                  application.applicant.badges.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {application.applicant.badges.slice(0, 3).map((b) => (
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
                      {application.applicant.badges.length > 3 && (
                        <span
                          className="text-[0.65rem] text-foreground/40 shrink-0"
                          title={application.applicant.badges.slice(3).map((b) => localizedName(b.badge.name as unknown as LocalizedName, lang)).join(", ")}
                        >
                          +{application.applicant.badges.length - 3}
                        </span>
                      )}
                    </div>
                  ) : null
                }
              />
            ) : (
              <Link
                href={`/profile/${encodeURIComponent(application.applicant.nickname)}`}
                target="_blank"
                className="text-foreground/80 font-medium hover:text-primary hover:underline underline-offset-4 transition-colors text-sm"
              >
                {application.applicant.nickname}
              </Link>
            )}
          </div>
        </div>
        <p className="text-xs text-foreground/40 mb-4 shrink-0">{serverName}</p>

        <div className="flex-1 flex flex-col min-h-0">
          <ApplicationThread
            lang={lang}
            applicationId={application.id}
            applicantName={application.applicantName}
            backHref={backHref}
            initialStatus={application.status}
            initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
            viewerId={viewer.id}
            isStaff={isStaff}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      </div>
    </main>
  );
}

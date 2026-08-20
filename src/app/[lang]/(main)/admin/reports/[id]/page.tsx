import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getReportViewer, canViewReport, isReportStaff, isReportEditor, isReportDeleter } from "@/lib/reports";
import { siteDb } from "@/lib/site-db";
import { ReportThread } from "@/components/reports/ReportThread";
import { Link } from "@/i18n/navigation";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { CompactBadgeChip } from "@/components/badges/CompactBadgeChip";
import { getPlayerCard } from "@/lib/player-card";
import { resolveReportMessages } from "@/lib/report-data";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const viewer = await getReportViewer();
  if (!viewer) redirect(`/${lang}/account/login`);

  const isStaff = isReportStaff(viewer);

  const [report, messages] = await Promise.all([
    siteDb.report.findUnique({
      where: { id },
      select: {
        id: true,
        reportedName: true,
        category: true,
        status: true,
        reporterId: true,
        reporter: {
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
    resolveReportMessages(id, isStaff),
  ]);

  // Same outcome (404) whether the report doesn't exist or just isn't this
  // viewer's to see — doesn't confirm a report ID exists to an unauthorized visitor.
  if (!report || !canViewReport(viewer, report)) notFound();

  const isOwner = report.reporterId === viewer.id;
  const canEdit = isReportEditor(viewer);
  const canDelete = isReportDeleter(viewer);

  let playerCard = null;
  if (isStaff && !isOwner && report.reporter.accountLink?.status === "CONFIRMED" && report.reporter.accountLink.minecraftName) {
    playerCard = await getPlayerCard(report.reporter.accountLink.minecraftName);
  }

  const t = await getTranslations("Reports");
  const backHref = `/admin/reports`;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">


        <div className="flex items-center justify-between gap-4 flex-wrap mb-1 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-foreground/45">{t("reportedLabel")}</span>
            <h1 className="text-2xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
              {report.reportedName}
            </h1>
          </div>
          {isStaff && !isOwner && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/45">{t("reporterLabel")}</span>
              {report.reporter.accountLink?.status === "CONFIRMED" && report.reporter.accountLink.minecraftName && playerCard ? (
                <PlayerAvatar
                  name={report.reporter.nickname}
                  skinUrl={playerCard.skinUrl}
                  hasSiteProfile={true}
                  linked={true}
                  online={playerCard.online}
                  siteOnline={playerCard.siteOnline}
                  appendNode={
                    report.reporter.badges.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {report.reporter.badges.slice(0, 3).map((b) => (
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
                        {report.reporter.badges.length > 3 && (
                          <span
                            className="text-[0.65rem] text-foreground/40 shrink-0"
                            title={report.reporter.badges.slice(3).map((b) => localizedName(b.badge.name as unknown as LocalizedName, lang)).join(", ")}
                          >
                            +{report.reporter.badges.length - 3}
                          </span>
                        )}
                      </div>
                    ) : null
                  }
                />
              ) : (
                <Link
                  href={`/profile/${encodeURIComponent(report.reporter.nickname)}`}
                  target="_blank"
                  className="text-foreground/80 font-medium hover:text-primary hover:underline underline-offset-4 transition-colors text-sm"
                >
                  {report.reporter.nickname}
                </Link>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-foreground/40 mb-4 shrink-0">{t(`category.${report.category}`)}</p>

        <div className="flex-1 flex flex-col min-h-0">
          <ReportThread
            lang={lang}
            reportId={report.id}
            reportedName={report.reportedName}
            backHref={backHref}
            initialStatus={report.status}
            initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
            viewerId={viewer.id}
            isStaff={isStaff}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      </div>
  );
}

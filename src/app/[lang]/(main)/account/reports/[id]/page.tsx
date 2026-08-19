import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getReportViewer, canViewReport, isReportStaff, isReportEditor, isReportDeleter } from "@/lib/reports";
import { siteDb } from "@/lib/site-db";
import { ReportThread } from "@/components/reports/ReportThread";
import { Link } from "@/i18n/navigation";
import { resolveReportMessages } from "@/lib/report-data";

export default async function AccountReportViewerPage({
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
      },
    }),
    resolveReportMessages(id, isStaff),
  ]);

  if (!report || !canViewReport(viewer, report)) notFound();

  const isOwner = report.reporterId === viewer.id;
  const canEdit = isReportEditor(viewer);
  const canDelete = isReportDeleter(viewer);

  const t = await getTranslations("Reports");
  const backHref = `/account/reports`;

  return (
    <>
      <Link href={backHref} className="text-xs text-foreground/45 hover:text-foreground/70 transition-colors mb-4 inline-block shrink-0 lg:hidden">
        {t("backToList")}
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-1 shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-foreground/45">{t("reportedLabel")}</span>
          <h1 className="text-2xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
            {report.reportedName}
          </h1>
        </div>
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
    </>
  );
}

import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getApplicationViewer, canViewApplication, isApplicationStaff, isApplicationEditor, isApplicationDeleter } from "@/lib/applications";
import { siteDb } from "@/lib/site-db";
import { ApplicationThread } from "@/components/applications/ApplicationThread";
import { Link } from "@/i18n/navigation";
import { resolveApplicationMessages } from "@/lib/application-data";
import { SERVERS } from "@/config/servers";

export default async function AccountApplicationViewerPage({
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
      },
    }),
    resolveApplicationMessages(id, isStaff),
  ]);

  if (!application || !canViewApplication(viewer, application)) notFound();

  const isOwner = application.applicantId === viewer.id;
  const canEdit = isApplicationEditor(viewer);
  const canDelete = isApplicationDeleter(viewer);

  const t = await getTranslations("Applications");
  const backHref = `/account/applications`;
  const serverName = SERVERS.find((s) => s.id === application.serverId)?.name ?? application.serverId;

  return (
    <>
      <Link href={backHref} className="text-xs text-foreground/45 hover:text-foreground/70 transition-colors mb-4 inline-block shrink-0 lg:hidden">
        {t("backToList")}
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-1 shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-foreground/45">{t("applicantLabel")}</span>
          <h1 className="text-2xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
            {application.applicantName}
          </h1>
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
    </>
  );
}

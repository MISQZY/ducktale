import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Paperclip } from "lucide-react";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { GoldDivider } from "@/components/common/GoldDivider";
import { CtaButton } from "@/components/common/CtaButton";
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge";
import { Link } from "@/i18n/navigation";
import { SERVERS } from "@/config/servers";

import { ServerPagination } from "@/components/common/ServerPagination";

const PAGE_SIZE = 10;

export default async function MyApplicationsPage({
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

  const t = await getTranslations("Applications");

  const [applications, total] = await Promise.all([
    siteDb.application.findMany({
      where: { applicantId: session.user.id },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        applicantName: true,
        serverId: true,
        status: true,
        updatedAt: true,
        messages: { select: { _count: { select: { attachments: true } } } },
      },
    }),
    siteDb.application.count({ where: { applicantId: session.user.id } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-16">
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
          <h1 className="text-3xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
            {t("myApplicationsTitle")}
          </h1>
          <CtaButton href={`/${lang}/account/applications/new`} className="px-5 py-2 text-xs">
            {t("newApplication")}
          </CtaButton>
        </div>
        <p className="text-foreground/60 mb-6">{t("myApplicationsDescription")}</p>

        <GoldDivider className="mb-8" />

        <div className="space-y-4 min-h-[30vh]">
          {applications.length === 0 ? (
            <p className="rounded-2xl border border-primary/20 bg-card/50 p-10 text-center text-foreground/40 text-sm">
              {t("noApplications")}
            </p>
          ) : (
            applications.map((application) => {
              const attachmentCount = application.messages.reduce((sum, m) => sum + m._count.attachments, 0);
              return (
                <Link
                  key={application.id}
                  href={`/applications/${application.id}`}
                  className="corner-ornament block rounded-2xl border border-primary/20 bg-card/50 p-5 relative overflow-hidden hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <span className="text-foreground/90 font-medium">{application.applicantName}</span>
                    <ApplicationStatusBadge status={application.status} label={t(`status.${application.status}`)} />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-foreground/40 text-xs">
                      {SERVERS.find((s) => s.id === application.serverId)?.name ?? application.serverId}
                    </span>
                    <p className="text-foreground/40 text-xs">
                      {t("updatedAt", { date: application.updatedAt.toLocaleString(lang === "ru" ? "ru-RU" : "en-US") })}
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
          pathname="/account/applications"
          buildQuery={(p) => ({ page: String(p) })}
          prevText={t("prevPage")}
          nextText={t("nextPage")}
        />
      </div>
    </main>
  );
}

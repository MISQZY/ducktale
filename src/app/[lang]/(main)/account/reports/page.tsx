import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Paperclip } from "lucide-react";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { GoldDivider } from "@/components/common/GoldDivider";
import { CtaButton } from "@/components/common/CtaButton";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { Link } from "@/i18n/navigation";

import { ServerPagination } from "@/components/common/ServerPagination";

const PAGE_SIZE = 10;

export default async function MyReportsPage({
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

  const t = await getTranslations("Reports");

  const [reports, total] = await Promise.all([
    siteDb.report.findMany({
      where: { reporterId: session.user.id },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        reportedName: true,
        category: true,
        status: true,
        updatedAt: true,
        messages: { select: { _count: { select: { attachments: true } } } },
      },
    }),
    siteDb.report.count({ where: { reporterId: session.user.id } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-16">
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
          <h1 className="text-3xl text-primary/90 leading-tight" style={{ fontFamily: "var(--font-body)" }}>
            {t("myReportsTitle")}
          </h1>
          <CtaButton href={`/${lang}/account/reports/new`} className="px-5 py-2 text-xs">
            {t("newReport")}
          </CtaButton>
        </div>
        <p className="text-foreground/60 mb-6">{t("myReportsDescription")}</p>

        <GoldDivider className="mb-8" />

        <div className="space-y-4 min-h-[30vh]">
          {reports.length === 0 ? (
            <p className="rounded-2xl border border-primary/20 bg-card/50 p-10 text-center text-foreground/40 text-sm">
              {t("noReports")}
            </p>
          ) : (
            reports.map((report) => {
              const attachmentCount = report.messages.reduce((sum, m) => sum + m._count.attachments, 0);
              return (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="corner-ornament block rounded-2xl border border-primary/20 bg-card/50 p-5 relative overflow-hidden hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <span className="text-foreground/90 font-medium">{report.reportedName}</span>
                    <ReportStatusBadge status={report.status} label={t(`status.${report.status}`)} />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-foreground/40 text-xs">{t(`category.${report.category}`)}</span>
                    <p className="text-foreground/40 text-xs">
                      {t("updatedAt", { date: report.updatedAt.toLocaleString(lang === "ru" ? "ru-RU" : "en-US") })}
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
          pathname="/account/reports"
          buildQuery={(p) => ({ page: String(p) })}
          prevText={t("prevPage")}
          nextText={t("nextPage")}
        />
      </div>
    </main>
  );
}

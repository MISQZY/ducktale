/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { ThreadTree } from "@/components/threads/ThreadTree";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return { title: t("reportsTitle") };
}

export default async function AdminReportsLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  await requireResourceRole(lang, "reports-view");
  const navAccess = await getAdminNavAccess();
  const t = await getTranslations("Admin");
  const total = await siteDb.report.count();

  return (
    <AdminPageShell title={t("reportsTitle")} description={t("reportsDescription", { count: total })} active="reports" navAccess={navAccess} fullHeight>
      <ResizablePanelGroup id="admin-reports-layout" orientation="horizontal" className="h-full w-full">
        <ResizablePanel id="admin-reports-sidebar" defaultSize="20" minSize="15" maxSize="35">
          <Suspense fallback={
            <div className="flex flex-col gap-2 p-4 h-full border-r border-primary/10">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg opacity-20" />
              ))}
            </div>
          }>
            <AdminReportList lang={lang} />
          </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

        <ResizablePanel id="admin-reports-content" defaultSize="80" minSize="40">
          <div suppressHydrationWarning className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4 sm:p-6">
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </AdminPageShell>
  );
}

async function AdminReportList({ lang }: { lang: string }) {
  const t = await getTranslations("Reports");
  const reports = await siteDb.report.findMany({
    take: 100,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      reportedName: true,
      category: true,
      updatedAt: true,
      reporter: { select: { nickname: true } },
      status: { select: { color: true, name: true } },
    },
  });

  return (
    <ThreadTree
      lang={lang}
      threads={reports.map((r) => {
        const catName = t(`category.${r.category}` as any) || r.category;
        return {
          id: r.id,
          title: t("reportColumn") + " " + r.id.substring(0, 6),
          authorNickname: r.reporter.nickname,
          updatedAt: r.updatedAt.toISOString(),
          typeLabel: catName,
          targetLabel: r.reportedName,
          statusColor: r.status.color,
          statusName: (r.status.name as any)?.[lang] || r.status.name,
        };
      })}
      basePath="admin/reports"
      noItemsLabel={t("noReports")}
      hideNewButton
    />
  );
}

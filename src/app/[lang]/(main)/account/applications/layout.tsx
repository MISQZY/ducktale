/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";
import { getApplicationViewer } from "@/lib/applications";
import { siteDb } from "@/lib/site-db";
import { ThreadTree } from "@/components/threads/ThreadTree";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Applications");
  return { title: t("myApplicationsTitle") };
}

export default async function AccountApplicationsLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  const viewer = await getApplicationViewer();
  
  if (!viewer) {
    redirect(`/${lang}/account/login`);
  }

  return (
    <main className="relative overflow-hidden h-dvh flex flex-col px-6 pt-24 pb-8">
      <div className="relative z-10 w-full flex-1 min-h-0">
        <ResizablePanelGroup id="account-applications-layout" orientation="horizontal" className="h-full w-full">
          <ResizablePanel id="account-applications-sidebar" defaultSize="20" minSize="15" maxSize="35">
            <Suspense fallback={
              <div className="flex flex-col gap-2 p-4 h-full border-r border-primary/10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg opacity-20" />
                ))}
              </div>
            }>
              <ApplicationList lang={lang} userId={viewer.id} />
            </Suspense>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

          <ResizablePanel id="account-applications-content" defaultSize="80" minSize="40">
            <div suppressHydrationWarning className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4 sm:p-6">
              {children}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}

async function ApplicationList({ lang, userId }: { lang: string; userId: string }) {
  const t = await getTranslations("Applications");
  const applications = await siteDb.application.findMany({
    where: { applicantId: userId },
    take: 50,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      applicantName: true,
      serverId: true,
      updatedAt: true,
      applicant: { select: { nickname: true } },
      status: { select: { color: true, name: true } },
    },
  });

  return (
    <ThreadTree
      lang={lang}
      threads={applications.map((a) => ({
        id: a.id,
        title: a.applicantName,
        authorNickname: a.applicant.nickname,
        updatedAt: a.updatedAt.toISOString(),
        targetLabel: a.serverId,
        statusColor: a.status.color,
        statusName: (a.status.name as any)?.[lang] || a.status.name,
      }))}
      basePath="account/applications"
      newButtonLabel={t("newApplication")} noItemsLabel={t("noApplications")}
    />
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";
import { requireResourceRole } from "@/lib/admin";
import { isThreadModerator } from "@/lib/threads";
import { siteDb } from "@/lib/site-db";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import { ThreadTree } from "@/components/threads/ThreadTree";
import { ThreadSectionsDialog } from "@/components/threads/ThreadSectionsDialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");
  return { title: t("threads") };
}

export default async function ThreadsLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  const viewer = await requireResourceRole(lang, "threads-view");
  const isModerator = isThreadModerator(viewer);

  return (
    <main className="relative overflow-hidden h-dvh flex flex-col px-6 pt-24 pb-8">
      <div className="relative z-10 w-full flex-1 min-h-0">
        <ResizablePanelGroup id="threads-layout" orientation="horizontal" className="h-full w-full">
          <ResizablePanel id="threads-sidebar" defaultSize="15" minSize="12" maxSize="30">
            <Suspense fallback={
              <div className="flex flex-col gap-2 p-4 h-full border-r border-primary/10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg opacity-20" />
                ))}
              </div>
            }>
              <ThreadList lang={lang} isModerator={isModerator} />
            </Suspense>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

          <ResizablePanel id="threads-content" defaultSize="85" minSize="40">
            <div suppressHydrationWarning className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4 sm:p-6">
              {children}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}

async function ThreadList({ lang, isModerator }: { lang: string; isModerator: boolean }) {
  const t = await getTranslations("Threads");

  const [threads, sections] = await Promise.all([
    siteDb.thread.findMany({
      take: 50,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        author: { select: { nickname: true } },
        status: { select: { color: true, name: true } },
        section: { select: { name: true } },
      },
    }),
    siteDb.threadSection.findMany({ select: { id: true, name: true } }),
  ]);

  const noSectionLabel = t("noSectionOption");

  return (
    <ThreadTree
      lang={lang}
      threads={threads.map((t) => ({
        id: t.id,
        title: t.title,
        authorNickname: t.author.nickname,
        updatedAt: t.updatedAt.toISOString(),
        statusColor: t.status.color,
        statusName: (t.status.name as any)?.[lang] || t.status.name,
        sectionName: t.section ? localizedName(t.section.name as unknown as LocalizedName, lang) : null,
      }))}
      groupBy="section"
      noSectionLabel={noSectionLabel}
      extraHeaderContent={
        isModerator ? (
          <ThreadSectionsDialog
            lang={lang}
            sections={sections.map((s) => ({ id: s.id, name: s.name as unknown as LocalizedName }))}
          />
        ) : undefined
      }
    />
  );
}

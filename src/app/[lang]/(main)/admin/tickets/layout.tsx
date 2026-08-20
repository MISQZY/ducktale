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
  return { title: t("ticketsTitle") };
}

export default async function AdminTicketsLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  await requireResourceRole(lang, "tickets-view");
  const navAccess = await getAdminNavAccess();
  const t = await getTranslations("Admin");
  const total = await siteDb.ticket.count();

  return (
    <AdminPageShell title={t("ticketsTitle")} description={t("ticketsDescription", { count: total })} active="tickets" navAccess={navAccess} fullHeight>
      <ResizablePanelGroup id="admin-tickets-layout" orientation="horizontal" className="h-full w-full">
        <ResizablePanel id="admin-tickets-sidebar" defaultSize="20" minSize="15" maxSize="35">
          <Suspense fallback={
            <div className="flex flex-col gap-2 p-4 h-full border-r border-primary/10">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg opacity-20" />
              ))}
            </div>
          }>
            <AdminTicketList lang={lang} />
          </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

        <ResizablePanel id="admin-tickets-content" defaultSize="80" minSize="40">
          <div suppressHydrationWarning className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4 sm:p-6">
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </AdminPageShell>
  );
}

async function AdminTicketList({ lang }: { lang: string }) {
  const t = await getTranslations("Tickets");
  const tickets = await siteDb.ticket.findMany({
    take: 100,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      updatedAt: true,
      user: { select: { nickname: true } },
      status: { select: { color: true, name: true } },
    },
  });

  return (
    <ThreadTree
      lang={lang}
      threads={tickets.map((t) => ({
        id: t.id,
        title: t.subject,
        authorNickname: t.user.nickname,
        updatedAt: t.updatedAt.toISOString(),
        statusColor: t.status.color,
        statusName: (t.status.name as any)?.[lang] || t.status.name,
      }))}
      basePath="admin/tickets"
      noItemsLabel={t("noTickets")}
      hideNewButton
    />
  );
}

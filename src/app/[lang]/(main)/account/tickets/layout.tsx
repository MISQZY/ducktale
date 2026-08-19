import { getTranslations } from "next-intl/server";
import { getTicketViewer } from "@/lib/tickets";
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
  const t = await getTranslations("Tickets");
  return { title: t("myTicketsTitle") };
}

export default async function AccountTicketsLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  const viewer = await getTicketViewer();
  
  if (!viewer) {
    redirect(`/${lang}/account/login`);
  }

  return (
    <main className="relative overflow-hidden h-dvh flex flex-col px-6 pt-24 pb-8">
      <div className="relative z-10 w-full flex-1 min-h-0">
        <ResizablePanelGroup id="account-tickets-layout" orientation="horizontal" className="h-full w-full">
          <ResizablePanel id="account-tickets-sidebar" defaultSize="20" minSize="15" maxSize="35">
            <Suspense fallback={
              <div className="flex flex-col gap-2 p-4 h-full border-r border-primary/10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg opacity-20" />
                ))}
              </div>
            }>
              <TicketList lang={lang} userId={viewer.id} />
            </Suspense>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

          <ResizablePanel id="account-tickets-content" defaultSize="80" minSize="40">
            <div suppressHydrationWarning className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4 sm:p-6">
              {children}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}

async function TicketList({ lang, userId }: { lang: string; userId: string }) {
  const t = await getTranslations("Tickets");
  const tickets = await siteDb.ticket.findMany({
    where: { userId },
    take: 50,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      subject: true,
      updatedAt: true,
      user: { select: { nickname: true } },
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
      }))}
      basePath="account/tickets"
      newButtonLabel={t("newTicket")} noItemsLabel={t("noTickets")}
    />
  );
}

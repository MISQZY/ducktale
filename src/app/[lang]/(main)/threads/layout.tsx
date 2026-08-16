import { requireResourceRole } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { ThreadTree } from "@/components/threads/ThreadTree";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default async function ThreadsLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;

  // Gated once here rather than in every page under this layout — every
  // /threads route needs threads-view (or isAdmin): no session redirects to
  // login, a session lacking the role redirects home (requireResourceRole,
  // src/lib/admin.ts) — unlike tickets, there's no per-thread ownership
  // check, this is the one gate for the whole feature.
  await requireResourceRole(lang, "threads-view");

  const threads = await siteDb.thread.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      author: { select: { nickname: true } },
    },
  });

  return (
    <main className="relative overflow-hidden h-dvh flex flex-col px-6 pt-24 pb-8">
      <div className="relative z-10 max-w-5xl mx-auto w-full flex-1 min-h-0">
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize="26" minSize="20" maxSize="40">
            <ThreadTree
              lang={lang}
              threads={threads.map((t) => ({
                id: t.id,
                title: t.title,
                authorNickname: t.author.nickname,
                updatedAt: t.updatedAt.toISOString(),
              }))}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

          <ResizablePanel defaultSize="74" minSize="50">
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}

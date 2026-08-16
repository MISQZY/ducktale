import { getTranslations } from "next-intl/server";
import { requirePublicResourceRole } from "@/lib/public-access";
import { SERVERS } from "@/config/servers";
import { resolveServerMaps } from "@/lib/maps";
import { MapServerTree } from "@/components/maps/MapServerTree";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Metadata } from "next";

// Default for the whole /maps subtree — [server]/[map]/page.tsx overrides
// it with the specific map's name; the index/[server] redirect-only pages
// have none of their own and just inherit this.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");
  return { title: t("maps") };
}

/**
 * Gated once here (same shape as threads/layout.tsx) rather than in every
 * page under this layout — every /maps route needs maps-page-view (an
 * anonymous visitor resolves it through the guest Role, see
 * requirePublicResourceRole's doc comment), same public-access pattern as
 * /docs and /leaderboard. Separate from `maps-edit`/`maps-delete`, which
 * gate /admin/maps instead (see RESOURCE_ROLE_ACTIONS's doc comment).
 */
export default async function MapsLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;

  await requirePublicResourceRole(lang, "maps-page-view");

  const [maps, t] = await Promise.all([
    resolveServerMaps(),
    getTranslations("Maps"),
  ]);

  const servers = SERVERS.map((s) => ({
    id: s.id,
    name: s.name,
    emoji: s.emoji,
    maps: maps.filter((m) => m.serverId === s.id).map((m) => ({ id: m.id, name: m.name })),
  }));

  return (
    <main className="relative overflow-hidden h-dvh flex flex-col px-6 pt-24 pb-8">
      <div className="relative z-10 w-full flex-1 min-h-0">
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize="16" minSize="12" maxSize="28">
            <MapServerTree lang={lang} servers={servers} noMapsLabel={t("noMapsInTree")} />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

          <ResizablePanel defaultSize="84" minSize="60">
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}

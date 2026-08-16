import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SERVERS } from "@/config/servers";
import { siteDb } from "@/lib/site-db";

/** /maps/[server] has no content of its own — redirects to that server's first map (oldest first, matching the sidebar's order), or shows an empty state if it has none configured yet. */
export default async function ServerMapsIndexPage({
  params,
}: {
  params: Promise<{ lang: string; server: string }>;
}) {
  const { lang, server } = await params;
  const config = SERVERS.find((s) => s.id === server);
  if (!config) notFound();

  const first = await siteDb.serverMap.findFirst({
    where: { serverId: server },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (first) redirect(`/${lang}/maps/${server}/${first.id}`);

  const t = await getTranslations("Maps");
  return (
    <div className="w-full h-full flex items-center justify-center rounded-2xl border border-primary/15 bg-card/30">
      <p className="text-foreground/40 text-sm">{t("noMap", { server: config.name })}</p>
    </div>
  );
}

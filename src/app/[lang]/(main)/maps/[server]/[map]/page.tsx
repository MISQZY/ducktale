import { notFound } from "next/navigation";
import { SERVERS } from "@/config/servers";
import { siteDb } from "@/lib/site-db";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import { MapEmbed } from "@/components/maps/MapEmbed";

export default async function MapPage({
  params,
}: {
  params: Promise<{ lang: string; server: string; map: string }>;
}) {
  const { lang, server, map } = await params;
  const config = SERVERS.find((s) => s.id === server);
  if (!config) notFound();

  const row = await siteDb.serverMap.findUnique({
    where: { id: map },
    select: { serverId: true, name: true, url: true },
  });
  // Same "does this map exist under this server" check whether the map id
  // is bogus or just belongs to a different server — no need to
  // distinguish those for a 404.
  if (!row || row.serverId !== server) notFound();

  return <MapEmbed mapId={map} url={row.url} title={localizedName(row.name as unknown as LocalizedName, lang)} />;
}

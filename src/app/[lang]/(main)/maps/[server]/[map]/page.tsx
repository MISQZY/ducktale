import { notFound } from "next/navigation";
import { SERVERS } from "@/config/servers";
import { siteDb } from "@/lib/site-db";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import { MapEmbed } from "@/components/maps/MapEmbed";
import type { Metadata } from "next";
import { cache } from "react";

const getMap = cache(async (id: string) => {
  return await siteDb.serverMap.findUnique({
    where: { id },
    select: { serverId: true, name: true, url: true },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; server: string; map: string }>;
}): Promise<Metadata> {
  const { lang, server, map } = await params;
  const config = SERVERS.find((s) => s.id === server);
  if (!config) return {};

  const row = await getMap(map);
  if (!row || row.serverId !== server) return {};

  return { title: `${localizedName(row.name as unknown as LocalizedName, lang)} — ${config.name}` };
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ lang: string; server: string; map: string }>;
}) {
  const { lang, server, map } = await params;
  const config = SERVERS.find((s) => s.id === server);
  if (!config) notFound();

  const row = await getMap(map);
  if (!row || row.serverId !== server) notFound();

  return <MapEmbed mapId={map} url={row.url} title={localizedName(row.name as unknown as LocalizedName, lang)} />;
}

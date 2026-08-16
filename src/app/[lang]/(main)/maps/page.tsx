import { redirect } from "next/navigation";
import { SERVERS } from "@/config/servers";
import { resolveServerMaps } from "@/lib/maps";

/** /maps has no content of its own — redirects to the first configured map (first server that has one, in SERVERS order), or that first server's own empty-state page if nothing's configured anywhere yet. */
export default async function MapsIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const maps = await resolveServerMaps();

  for (const server of SERVERS) {
    const first = maps.find((m) => m.serverId === server.id);
    if (first) redirect(`/${lang}/maps/${server.id}/${first.id}`);
  }

  redirect(`/${lang}/maps/${SERVERS[0].id}`);
}

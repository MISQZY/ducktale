import { siteDb } from "@/lib/site-db";
import type { LocalizedName } from "@/lib/i18n-name";

export interface ServerMapEntry {
  id: string;
  serverId: string;
  name: LocalizedName;
  url: string;
}

/**
 * Every configured map across every server, oldest first — used by both the
 * public /maps section (grouped per server into MapServerTree) and
 * /admin/maps (listing each server's existing maps to edit/delete). A
 * server with no entries here just has no maps configured yet.
 */
export async function resolveServerMaps(): Promise<ServerMapEntry[]> {
  const rows = await siteDb.serverMap.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, serverId: true, name: true, url: true },
  });
  return rows.map((r) => ({ ...r, name: r.name as unknown as LocalizedName }));
}

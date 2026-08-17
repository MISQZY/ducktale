import { siteDb } from "@/lib/site-db";
import type { LocalizedName } from "@/lib/i18n-name";
import type { EventCategory } from "@/config/events";

export interface ServerEventEntry {
  id: string;
  serverId: string | null;
  icon: string;
  category: EventCategory;
  name: LocalizedName;
  description: LocalizedName;
  /** Unix seconds — matches EventTimeline's ServerEvent shape (Date -> seconds, not ms, done here once instead of in every consumer). */
  startAt: number;
  endAt: number;
  href: string | null;
}

/**
 * Every configured event, soonest-start-first — used by both /admin/events
 * (listing to edit/delete) and the public /events page. No caching here
 * (unlike, say, the leaderboard) — matches resolveServerMaps' own
 * uncached shape in src/lib/maps.ts, a small enough table that a plain query
 * per request is fine.
 */
export async function resolveServerEvents(): Promise<ServerEventEntry[]> {
  const rows = await siteDb.serverEvent.findMany({
    orderBy: { startAt: "asc" },
    select: { id: true, serverId: true, icon: true, category: true, name: true, description: true, startAt: true, endAt: true, href: true },
  });
  return rows.map((r) => ({
    ...r,
    category: r.category as EventCategory,
    name: r.name as unknown as LocalizedName,
    description: r.description as unknown as LocalizedName,
    startAt: Math.floor(r.startAt.getTime() / 1000),
    endAt: Math.floor(r.endAt.getTime() / 1000),
  }));
}

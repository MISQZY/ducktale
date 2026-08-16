import { NextResponse } from "next/server";
import { SERVERS } from "@/config/servers";
import { getAllOnlinePlayers, groupOnlinePlayersByServer, getMaintenanceStatuses } from "@/lib/players";
import { getCachedPing } from "@/lib/mcsrvstat";
import { isRateLimited } from "@/lib/rate-limit";
import { hasPublicResourceRole } from "@/lib/public-access";

interface ServerStatus {
  // Both omitted (not just falsy) when the caller lacks server-status-view —
  // version is public info independent of that role, see the branch below.
  online?: boolean;
  maintenance?: boolean;
  version?: string;
  players?: { online: number; max: number; list: { name: string }[] };
}

export async function GET(req: Request) {
  if (isRateLimited(req, "server-status-all", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const pings = await Promise.all(SERVERS.map((s) => getCachedPing(s.host)));

  // server-status-view gates online/offline + who's-playing visibility, not
  // the version string — that stays visible to everyone regardless of role.
  if (!(await hasPublicResourceRole("server-status-view"))) {
    const versionOnly: Record<string, ServerStatus> = Object.fromEntries(
      SERVERS.map((s, i) => [s.host, { version: pings[i].version }] as const)
    );
    return NextResponse.json(versionOnly, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  }

  const [allPlayers, maintenanceStatuses] = await Promise.all([
    getAllOnlinePlayers().catch((err) => {
      console.error("[server-status] Failed to load online players:", err);
      return [];
    }),
    getMaintenanceStatuses().catch((err) => {
      console.error("[server-status] Failed to load maintenance statuses:", err);
      return new Set<string>();
    })
  ]);

  const grouped = groupOnlinePlayersByServer(allPlayers);

  const statuses: Record<string, ServerStatus> = Object.fromEntries(
    SERVERS.map((s, i) => {
      const roster = grouped.get(s.uuid) ?? [];
      const ping = pings[i];
      return [
        s.host,
        {
          online: ping.online,
          maintenance: maintenanceStatuses.has(s.uuid),
          version: ping.version,
          players: {
            online: roster.length,
            max: ping.players?.max ?? 0,
            list: roster.map((p) => ({ name: p.name })),
          },
        },
      ] as const;
    })
  );

  return NextResponse.json(statuses, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
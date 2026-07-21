import { NextResponse } from "next/server";
import { SERVERS } from "@/config/servers";
import { getAllOnlinePlayers, groupOnlinePlayersByServer } from "@/lib/players";
import { getCachedPing } from "@/lib/mcsrvstat";

interface ServerStatus {
  online: boolean;
  version?: string;
  players: { online: number; max: number; list: { name: string }[] };
}

export async function GET() {
  const [allPlayers, pings] = await Promise.all([
    getAllOnlinePlayers().catch((err) => {
      console.error("[server-status] Failed to load online players:", err);
      return [];
    }),
    Promise.all(SERVERS.map((s) => getCachedPing(s.host))),
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
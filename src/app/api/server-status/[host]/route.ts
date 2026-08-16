import { NextResponse } from "next/server";
import { NETWORK_HOST, SERVERS } from "@/config/servers";
import { getAllOnlinePlayers, groupOnlinePlayersByServer } from "@/lib/players";
import { getCachedPing } from "@/lib/mcsrvstat";
import { isRateLimited } from "@/lib/rate-limit";
import { hasPublicResourceRole } from "@/lib/public-access";

const ALLOWED_HOSTS = new Set([NETWORK_HOST, ...SERVERS.map((s) => s.host)]);
const SERVER_UUID_BY_HOST = new Map(SERVERS.map((s) => [s.host, s.uuid]));

interface ServerStatus {
  online: boolean;
  version?: string;
  players: { online: number; max: number; list: { name: string }[] };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ host: string }> }
) {
  if (isRateLimited(req, "server-status-host", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Not cached (unlike the 200 below) — a denial shouldn't stick around in a
  // shared cache for other visitors, especially once access is restored.
  if (!(await hasPublicResourceRole("server-status-view"))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { host } = await params;

  if (!ALLOWED_HOSTS.has(host)) {
    return NextResponse.json({ error: "Unknown host" }, { status: 400 });
  }

  const [allPlayers, ping] = await Promise.all([
    getAllOnlinePlayers().catch((err) => {
      console.error(`[server-status] Failed to load online players for "${host}":`, err);
      return [];
    }),
    getCachedPing(host),
  ]);

  const roster =
    host === NETWORK_HOST
      ? allPlayers
      : groupOnlinePlayersByServer(allPlayers).get(
          SERVER_UUID_BY_HOST.get(host) ?? ""
        ) ?? [];

  const status: ServerStatus = {
    online: ping.online,
    version: ping.version,
    players: {
      online: roster.length,
      max: ping.players?.max ?? 0,
      list: roster.map((p) => ({ name: p.name })),
    },
  };

  return NextResponse.json(status, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
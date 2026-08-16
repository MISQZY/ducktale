import { NextResponse } from "next/server";
import { NETWORK_HOST, SERVERS } from "@/config/servers";
import { getAllOnlinePlayers, groupOnlinePlayersByServer } from "@/lib/players";
import { getCachedPing } from "@/lib/mcsrvstat";
import { isRateLimited } from "@/lib/rate-limit";
import { hasPublicResourceRole } from "@/lib/public-access";
import { resolveSkinUrls } from "@/lib/skin";

const ALLOWED_HOSTS = new Set([NETWORK_HOST, ...SERVERS.map((s) => s.host)]);
const SERVER_UUID_BY_HOST = new Map(SERVERS.map((s) => [s.host, s.uuid]));

interface ServerStatus {
  // Both omitted (not just falsy) when the caller lacks server-status-view —
  // version is public info independent of that role, see the branch below.
  online?: boolean;
  version?: string;
  players?: { online: number; max: number; list: { name: string; skinUrl: string | null }[] };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ host: string }> }
) {
  if (isRateLimited(req, "server-status-host", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { host } = await params;

  if (!ALLOWED_HOSTS.has(host)) {
    return NextResponse.json({ error: "Unknown host" }, { status: 400 });
  }

  const ping = await getCachedPing(host);

  // server-status-view gates online/offline + who's-playing visibility, not
  // the version string — that stays visible to everyone regardless of role.
  if (!(await hasPublicResourceRole("server-status-view"))) {
    return NextResponse.json(
      { version: ping.version } satisfies ServerStatus,
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } }
    );
  }

  const allPlayers = await getAllOnlinePlayers().catch((err) => {
    console.error(`[server-status] Failed to load online players for "${host}":`, err);
    return [];
  });

  const roster =
    host === NETWORK_HOST
      ? allPlayers
      : groupOnlinePlayersByServer(allPlayers).get(
          SERVER_UUID_BY_HOST.get(host) ?? ""
        ) ?? [];

  const skinUrls = await resolveSkinUrls(roster.map((p) => p.uuid));

  const status: ServerStatus = {
    online: ping.online,
    version: ping.version,
    players: {
      online: roster.length,
      max: ping.players?.max ?? 0,
      list: roster.map((p, i) => ({ name: p.name, skinUrl: skinUrls[i] ?? null })),
    },
  };

  return NextResponse.json(status, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
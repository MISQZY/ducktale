import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { Prisma } from "@prisma/client";

/** Fallback display name for players who never set a FlectonePulse nickname. */
export const FALLBACK_NICKNAME = "Путник";

/**
 * The FlectonePulse player + nickname join, reused verbatim by every route
 * that needs to resolve a display name (player card, player search, towns).
 */
export const PLAYER_NICKNAME_JOIN = Prisma.sql`
  FROM fp_player p
  LEFT JOIN fp_setting s ON s.player = p.id AND s.type = 'NICKNAME'
`;

export interface OnlinePlayer {
  name: string;
  serverId: string;
}

// Both server-status routes call this on every poll (the homepage widget
// polls /api/server-status/all every API.pollIntervalMs from *every* open
// tab, uncoordinated across visitors) — without a cache here, a handful of
// concurrent visitors is enough to queue up more raw queries than the
// database's connection pool can serve at once. A TTL well under the poll
// interval keeps data fresh while collapsing simultaneous polls into one query.
const ONLINE_PLAYERS_TTL_MS = 20_000;

export async function getAllOnlinePlayers(
  dbKey: string = "default"
): Promise<OnlinePlayer[]> {
  return withCache(`online-players:${dbKey}`, ONLINE_PLAYERS_TTL_MS, () =>
    withDb(dbKey, (db) =>
      db.$queryRaw<OnlinePlayer[]>(Prisma.sql`
        SELECT p.name, s.value AS serverId
        FROM fp_player p
        INNER JOIN fp_setting s
          ON  s.player = p.id
          AND s.type = 'SERVER'
        WHERE p.online = 1
        ORDER BY p.name ASC
      `)
    )
  );
}

export function groupOnlinePlayersByServer(
  players: OnlinePlayer[]
): Map<string, OnlinePlayer[]> {
  const grouped = new Map<string, OnlinePlayer[]>();
  for (const player of players) {
    const bucket = grouped.get(player.serverId);
    if (bucket) bucket.push(player);
    else grouped.set(player.serverId, [player]);
  }
  return grouped;
}

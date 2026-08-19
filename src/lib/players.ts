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

/** Looks up FlectonePulse nicknames for a batch of usernames in one query — shared by every route that resolves a town's resident list (docs towns table, town ranking). */
export async function resolveNicknames(usernames: string[]): Promise<Map<string, string | null>> {
  if (usernames.length === 0) return new Map();

  const rows = await withDb(async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT p.name, s.value AS nickname
      ${PLAYER_NICKNAME_JOIN}
      WHERE p.name IN (${Prisma.join(usernames)})
    `) as { name: string; nickname: string | null }[];
  });

  return new Map(rows.map((r) => [r.name, r.nickname]));
}

export interface OnlinePlayer {
  name: string;
  uuid: string;
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
        SELECT p.name, p.uuid, s.value AS serverId
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

export async function getMaintenanceStatuses(
  dbKey: string = "default"
): Promise<Set<string>> {
  return withCache(`maintenance-statuses:${dbKey}`, 60_000, async () => {
    const rows = await withDb(dbKey, (db) =>
      db.$queryRaw<{ server: string }[]>(Prisma.sql`
        SELECT server
        FROM fp_moderation
        WHERE player = -1 AND type = 'maintenance' AND valid = 1
      `)
    );
    return new Set(rows.map((r) => r.server));
  });
}
export async function getServerWhitelistStatuses(
  dbKey: string = "default"
): Promise<Set<string>> {
  return withCache(`server-whitelist-statuses:${dbKey}`, 60_000, async () => {
    const rows = await withDb(dbKey, (db) =>
      db.$queryRaw<{ server: string }[]>(Prisma.sql`
        SELECT server
        FROM fp_moderation
        WHERE player = -1 AND type = 'whitelist' AND valid = 1
      `)
    );
    return new Set(rows.map((r) => r.server));
  });
}

/**
 * Gets the last seen timestamp (ms) for a batch of UUIDs.
 * Uses a short TTL cache to avoid spamming the database from admin pages.
 */
export async function getPlayersLastSeenMap(uuids: string[], dbKey: string = "default"): Promise<Map<string, number>> {
  if (uuids.length === 0) return new Map();

  // Sort UUIDs to ensure stable cache key regardless of order
  const sortedUuids = [...uuids].sort();
  // Using a short 30-second TTL so last-seen stays relatively fresh but deduplicates concurrent/rapid requests
  return withCache(`players-last-seen:${dbKey}:${sortedUuids.join(",")}`, 30_000, async () => {
    const players = await withDb(dbKey, (db) => 
      db.fp_player.findMany({
        where: { uuid: { in: sortedUuids } },
        select: { uuid: true, fp_time: { select: { last: true } } }
      })
    );

    const map = new Map<string, number>();
    for (const p of players) {
      if (p.fp_time?.last) {
        map.set(p.uuid, Number(p.fp_time.last));
      }
    }
    return map;
  });
}

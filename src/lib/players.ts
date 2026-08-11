import { withDb } from "@/lib/db";
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

export async function getAllOnlinePlayers(
  dbKey: string = "default"
): Promise<OnlinePlayer[]> {
  return withDb(dbKey, (db) =>
    db.$queryRaw<OnlinePlayer[]>(Prisma.sql`
      SELECT p.name, s.value AS serverId
      FROM fp_player p
      INNER JOIN fp_setting s
        ON  s.player = p.id
        AND s.type = 'SERVER'
      WHERE p.online = 1
      ORDER BY p.name ASC
    `)
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

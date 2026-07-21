import { withDb } from "@/lib/db";
import { Prisma } from "@prisma/client";

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
import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { Prisma } from "@prisma/client";
import { isRateLimited } from "@/lib/rate-limit";
import { PLAYER_NICKNAME_JOIN } from "@/lib/players";
import type { LeaderboardPlayer, LeaderboardResponse } from "@/types/leaderboard";

export type { LeaderboardPlayer, LeaderboardResponse };

interface RawRow {
  uuid:       string;
  name:       string;
  nickname:   string | null;
  playtimeMs: bigint;
  online:     number | boolean; // raw MySQL boolean from fp_player.online — 0/1, not a JS boolean
  total:      bigint;
}

const LEADERBOARD_TTL_MS = 60_000;

/**
 * Ranked purely by fp_time.total (network-wide playtime, same source as the
 * player card) — an INNER JOIN on purpose, since a player with no tracked
 * playtime has no meaningful rank to show, not just a 0 that would sort to
 * the bottom.
 */
async function buildLeaderboardResponse(
  page: number, pageSize: number, search: string
): Promise<LeaderboardResponse> {
  const offset = (page - 1) * pageSize;

  const rows: RawRow[] = await withDb(async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT
        p.uuid,
        p.name,
        s.value AS nickname,
        t.total AS playtimeMs,
        p.online AS online,
        COUNT(*) OVER() AS total
      ${PLAYER_NICKNAME_JOIN}
      INNER JOIN fp_time t ON t.player = p.id
      ${search ? Prisma.sql`WHERE p.name LIKE ${"%" + search + "%"} OR s.value LIKE ${"%" + search + "%"}` : Prisma.empty}
      ORDER BY t.total DESC
      LIMIT  ${pageSize}
      OFFSET ${offset}
    `) as RawRow[];
  });

  const total = rows.length > 0 ? Number(rows[0].total) : 0;

  return {
    players: rows.map((r) => ({
      uuid:       r.uuid,
      name:       r.name,
      nickname:   r.nickname,
      playtimeMs: Number(r.playtimeMs),
      online:     Boolean(r.online),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function GET(req: Request) {
  if (isRateLimited(req, "leaderboard", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);

  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1",  10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const search   = searchParams.get("search")?.trim() ?? "";

  try {
    const result = await withCache(
      `leaderboard:${page}:${pageSize}:${search.toLowerCase()}`,
      LEADERBOARD_TTL_MS,
      () => buildLeaderboardResponse(page, pageSize, search)
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[leaderboard] DB error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

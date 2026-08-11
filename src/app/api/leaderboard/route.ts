import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { siteDb } from "@/lib/site-db";
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
  rank:       bigint;
  total:      bigint;
}

const LEADERBOARD_TTL_MS = 60_000;

/**
 * Ranked purely by fp_time.total (network-wide playtime, same source as the
 * player card) — an INNER JOIN on purpose, since a player with no tracked
 * playtime has no meaningful rank to show, not just a 0 that would sort to
 * the bottom.
 *
 * `rank` is computed by RANK() over the *unfiltered* inner query, then the
 * search filter is applied as an outer WHERE — a search still has to show
 * each player's real position on the full leaderboard, not their position
 * among just the search results (which is what a WHERE-before-RANK() would
 * give, since window functions only ever see already-filtered rows).
 */
async function buildLeaderboardResponse(
  page: number, pageSize: number, search: string
): Promise<LeaderboardResponse> {
  const offset = (page - 1) * pageSize;

  const rows: RawRow[] = await withDb(async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT sub.uuid, sub.name, sub.nickname, sub.playtimeMs, sub.online, sub.\`rank\`,
             COUNT(*) OVER() AS total
      FROM (
        SELECT
          p.uuid,
          p.name,
          s.value AS nickname,
          t.total AS playtimeMs,
          p.online AS online,
          RANK() OVER (ORDER BY t.total DESC) AS \`rank\`
        ${PLAYER_NICKNAME_JOIN}
        INNER JOIN fp_time t ON t.player = p.id
      ) sub
      ${search ? Prisma.sql`WHERE sub.name LIKE ${"%" + search + "%"} OR sub.nickname LIKE ${"%" + search + "%"}` : Prisma.empty}
      ORDER BY sub.\`rank\` ASC
      LIMIT  ${pageSize}
      OFFSET ${offset}
    `) as RawRow[];
  });

  const total = rows.length > 0 ? Number(rows[0].total) : 0;

  // Only this page's rows, not the whole leaderboard — a plain indexed
  // lookup by minecraftUuid, cheap regardless of page size (capped at 100).
  const links = rows.length > 0
    ? await siteDb.accountLink.findMany({
        where: { minecraftUuid: { in: rows.map((r) => r.uuid) }, status: "CONFIRMED" },
        select: {
          minecraftUuid: true,
          user: {
            select: {
              nickname: true,
              badges: { select: { badge: { select: { name: true, icon: true, color: true, description: true, earnCondition: true } } } },
            },
          },
        },
      })
    : [];
  const linkByUuid = new Map(links.map((l) => [l.minecraftUuid, l.user]));

  return {
    players: rows.map((r) => {
      const linkedUser = linkByUuid.get(r.uuid);
      return {
        uuid:       r.uuid,
        name:       r.name,
        nickname:   r.nickname,
        playtimeMs: Number(r.playtimeMs),
        online:     Boolean(r.online),
        rank:       Number(r.rank),
        profileUsername: linkedUser?.nickname ?? null,
        badges: linkedUser?.badges.map(({ badge }) => badge) ?? [],
      };
    }),
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

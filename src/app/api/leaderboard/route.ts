import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { siteDb } from "@/lib/site-db";
import { withCache } from "@/lib/query-cache";
import { Prisma } from "@prisma/client";
import { isRateLimited } from "@/lib/rate-limit";
import { PLAYER_NICKNAME_JOIN } from "@/lib/players";
import { resolveSkinUrl } from "@/lib/skin";
import { isUserOnline } from "@/lib/presence";
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
  page: number, pageSize: number, search: string, sort: string, order: string
): Promise<LeaderboardResponse> {
  const offset = (page - 1) * pageSize;

  // sub.uuid tiebreaker on every branch: ties (equal playtime, or the
  // default rank ASC when several players share a rank) would otherwise
  // sort in whatever order MySQL feels like per-query, which can reshuffle
  // rows between pages — a stable secondary key keeps pagination consistent.
  let orderSql = Prisma.sql`ORDER BY sub.\`rank\` ASC, sub.uuid ASC`;
  const dir = order === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  switch (sort) {
    case "rank":
      orderSql = Prisma.sql`ORDER BY sub.\`rank\` ${dir}, sub.uuid ASC`;
      break;
    case "player":
      orderSql = Prisma.sql`ORDER BY sub.name ${dir}, sub.uuid ASC`;
      break;
    case "playtime":
      orderSql = Prisma.sql`ORDER BY sub.playtimeMs ${dir}, sub.uuid ASC`;
      break;
  }

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
      ${orderSql}
      LIMIT  ${pageSize}
      OFFSET ${offset}
    `) as RawRow[];
  });

  const total = rows.length > 0 ? Number(rows[0].total) : 0;

  // Only this page's rows, not the whole leaderboard — a plain indexed
  // lookup by minecraftUuid, cheap regardless of page size (capped at 100).
  // Also carries what's needed for site presence (userId + persisted
  // lastSeenAt) so that doesn't need its own separate query — see
  // src/lib/presence.ts for why "online now" itself is an in-memory check
  // (isUserOnline), not something this query could answer on its own.
  const links = rows.length > 0
    ? await siteDb.accountLink.findMany({
        where: { minecraftUuid: { in: rows.map((r) => r.uuid) }, status: "CONFIRMED" },
        select: {
          minecraftUuid: true,
          userId: true,
          user: {
            select: {
              nickname: true,
              lastSeenAt: true,
              badges: { select: { badge: { select: { name: true, icon: true, color: true, description: true, earnCondition: true } } } },
            },
          },
        },
      })
    : [];
  const linkByUuid = new Map(links.map((l) => [l.minecraftUuid, l]));

  // Fetch skins for all players on the current page
  const skinUrls = await Promise.all(rows.map((r) => resolveSkinUrl(r.uuid)));
  const skinByUuid = new Map(rows.map((r, i) => [r.uuid, skinUrls[i]]));

  return {
    players: rows.map((r) => {
      const link = linkByUuid.get(r.uuid);
      const siteOnline = link ? isUserOnline(link.userId) : false;
      const dbLastSeenMs = link?.user.lastSeenAt?.getTime() ?? undefined;
      return {
        uuid:       r.uuid,
        name:       r.name,
        nickname:   r.nickname,
        playtimeMs: Number(r.playtimeMs),
        online:     Boolean(r.online),
        rank:       Number(r.rank),
        profileUsername: link?.user.nickname ?? null,
        badges: link?.user.badges.map(({ badge }) => badge) ?? [],
        skinUrl: skinByUuid.get(r.uuid) ?? null,
        siteOnline,
        siteLastSeenMs: dbLastSeenMs ?? null,
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function GET(req: Request) {
  if (isRateLimited(req, "leaderboard", 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);

  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1",  10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const search   = searchParams.get("search")?.trim() ?? "";
  const sort     = searchParams.get("sort")?.trim() ?? "";
  const order    = searchParams.get("order")?.trim() ?? "";

  try {
    const result = await withCache(
      `leaderboard:${page}:${pageSize}:${search.toLowerCase()}:${sort}:${order}`,
      LEADERBOARD_TTL_MS,
      () => buildLeaderboardResponse(page, pageSize, search, sort, order)
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

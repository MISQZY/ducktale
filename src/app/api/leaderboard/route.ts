import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { siteDb } from "@/lib/site-db";
import { withCache } from "@/lib/query-cache";
import { assembleResidents, townBaseQuery, type ResidentRow } from "@/lib/towny";
import { Prisma } from "@prisma/client";
import { isRateLimited } from "@/lib/rate-limit";
import { FALLBACK_NICKNAME, PLAYER_NICKNAME_JOIN, resolveNicknames } from "@/lib/players";
import { resolveSkinUrls } from "@/lib/skin";
import { isUserOnline } from "@/lib/presence";
import type { LeaderboardPlayer, LeaderboardResponse } from "@/types/leaderboard";
import type { RankedTown, TownRankingResponse } from "@/types/town-ranking";

export type { LeaderboardPlayer, LeaderboardResponse, RankedTown, TownRankingResponse };

/**
 * One endpoint for every ranking category, selected by `?type=` — same
 * shape as pagination's `?page=`: a single route parameterized by a query
 * argument instead of a separate route per category. `players` (default)
 * and `towns` share the pagination/search/sort/order query contract, the
 * withCache/rate-limit conventions, and this file, even though they hit
 * different databases underneath.
 */
type LeaderboardType = "players" | "towns";

const LEADERBOARD_TTL_MS = 60_000;
const TOWN_RANKING_TTL_MS = 60_000;

interface RawPlayerRow {
  uuid:       string;
  name:       string;
  nickname:   string | null;
  playtimeMs: bigint;
  online:     number | boolean; // raw MySQL boolean from fp_player.online — 0/1, not a JS boolean
  rank:       bigint;
  total:      bigint;
}

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

  const rows: RawPlayerRow[] = await withDb(async (db) => {
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
    `) as RawPlayerRow[];
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
              // Only an explicitly pinned badge shows here — no fallback to
              // "earliest awarded" when nothing's pinned (see
              // BadgePinSelector: a lone badge isn't auto-pinned either).
              // At most one row can match (setPinnedBadge enforces that),
              // take:1 is just belt-and-suspenders.
              badges: {
                where: { pinned: true },
                take: 1,
                select: { badge: { select: { name: true, icon: true, color: true, description: true, earnCondition: true } } },
              },
            },
          },
        },
      })
    : [];
  const linkByUuid = new Map(links.map((l) => [l.minecraftUuid, l]));

  const skinUrls = await resolveSkinUrls(rows.map((r) => r.uuid));
  const skinByUuid = new Map(rows.map((r, i) => [r.uuid, skinUrls[i]]));

  return {
    players: rows.map((r) => {
      const link = linkByUuid.get(r.uuid);
      const siteOnline = link ? isUserOnline(link.userId) : false;
      const dbLastSeenMs = link?.user.lastSeenAt?.getTime() ?? undefined;

      // Already filtered to pinned:true by the query above.
      const displayBadge = link?.user.badges[0]?.badge;

      return {
        uuid:       r.uuid,
        name:       r.name,
        nickname:   r.nickname,
        playtimeMs: Number(r.playtimeMs),
        online:     Boolean(r.online),
        rank:       Number(r.rank),
        profileUsername: link?.user.nickname ?? null,
        badges: displayBadge ? [displayBadge] : [],
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

interface RawTownRow {
  name:      string;
  tag:       string | null;
  uuid:      string;
  mayorUuid: string | null;
  nation:    string | null;
  nationTag: string | null;
  size:      bigint;
  rank:      bigint;
  total:     bigint;
}

/**
 * Ranked by town size (claimed TOWNY_TOWNBLOCKS count) — the same metric
 * /api/towns already sorts by for the docs page, just with an explicit
 * rank column here. Same rule as the player leaderboard: RANK() is
 * computed over the *unranked* inner query, then the search filter is
 * applied as an outer WHERE — a search still has to show each town's real
 * position in the full ranking, not its position among the search matches
 * (which is what a WHERE-before-RANK() would give).
 *
 * Residents are resolved the same way /api/towns does it — a second,
 * uuid-indexed query against only this page's towns (never the full
 * ranking), plus a nickname lookup — so the expandable resident dropdown
 * costs the same two extra round-trips regardless of how many towns exist.
 */
async function buildTownRankingResponse(
  page: number, pageSize: number, search: string, sort: string, order: string
): Promise<TownRankingResponse> {
  const offset = (page - 1) * pageSize;

  const { rows, residentRows } = await withDb("duckburg_towns", async (db) => {
      // outer2.name tiebreaker on every branch (town names are unique) —
      // without it, ties (equal size, equal rank, or several towns sharing
      // no nation) sort in whatever order MySQL feels like per-query,
      // which can reshuffle rows between pages.
      let orderSql = Prisma.sql`ORDER BY outer2.\`rank\` ASC, outer2.name ASC`;
      const dir = order === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
      switch (sort) {
        case "rank":
          orderSql = Prisma.sql`ORDER BY outer2.\`rank\` ${dir}, outer2.name ASC`;
          break;
        case "town":
          orderSql = Prisma.sql`ORDER BY outer2.name ${dir}`;
          break;
        case "nation":
          orderSql = Prisma.sql`ORDER BY outer2.nation ${dir}, outer2.name ASC`;
          break;
        case "size":
          orderSql = Prisma.sql`ORDER BY outer2.size ${dir}, outer2.name ASC`;
          break;
      }

      const rows = await db.$queryRaw(Prisma.sql`
        SELECT outer2.name, outer2.tag, outer2.uuid, outer2.mayorUuid, outer2.nation, outer2.nationTag, outer2.size, outer2.\`rank\`,
               COUNT(*) OVER() AS total
        FROM (
          SELECT inner1.*, RANK() OVER (ORDER BY inner1.size DESC) AS \`rank\`
          FROM (
            ${townBaseQuery(Prisma.sql`, t.uuid AS uuid, t.mayor AS mayorUuid`)}
          ) inner1
        ) outer2
        ${search ? Prisma.sql`WHERE outer2.name LIKE ${"%" + search + "%"}` : Prisma.empty}
        ${orderSql}
        LIMIT  ${pageSize}
        OFFSET ${offset}
      `) as RawTownRow[];

      const townUuids = rows.map((r) => r.uuid);
      const residentRows = townUuids.length === 0 ? [] : await db.$queryRaw(Prisma.sql`
        SELECT r.name AS name, r.uuid AS uuid, r.town AS town, r.\`town-ranks\` AS ranks
        FROM TOWNY_RESIDENTS r
        WHERE r.town IN (${Prisma.join(townUuids)})
      `) as ResidentRow[];

      return { rows, residentRows };
  });

  const total = rows.length > 0 ? Number(rows[0].total) : 0;

  const [nicknames, residentSkinUrlList] = await Promise.all([
    resolveNicknames(residentRows.map((r) => r.name)),
    resolveSkinUrls(residentRows.map((r) => r.uuid)),
  ]);
  const residentSkinUrls = new Map(residentRows.map((r, i) => [r.uuid, residentSkinUrlList[i]]));

  const residentsByTown = new Map<string, ResidentRow[]>();
  for (const r of residentRows) {
    const list = residentsByTown.get(r.town) ?? [];
    list.push(r);
    residentsByTown.set(r.town, list);
  }

  return {
    towns: rows.map((r) => ({
      name:      r.name,
      tag:       r.tag,
      nation:    r.nation,
      nationTag: r.nationTag,
      size:      Number(r.size),
      rank:      Number(r.rank),
      residents: assembleResidents(residentsByTown.get(r.uuid) ?? [], r.mayorUuid, nicknames, FALLBACK_NICKNAME, residentSkinUrls),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type: LeaderboardType = searchParams.get("type") === "towns" ? "towns" : "players";

  if (isRateLimited(req, `leaderboard-${type}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1",  10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const search   = searchParams.get("search")?.trim() ?? "";
  const sort     = searchParams.get("sort")?.trim() ?? "";
  const order    = searchParams.get("order")?.trim() ?? "";

  try {
    const result = type === "towns"
      ? await withCache(
          `leaderboard:towns:${page}:${pageSize}:${search.toLowerCase()}:${sort}:${order}`,
          TOWN_RANKING_TTL_MS,
          () => buildTownRankingResponse(page, pageSize, search, sort, order)
        )
      : await withCache(
          `leaderboard:players:${page}:${pageSize}:${search.toLowerCase()}:${sort}:${order}`,
          LEADERBOARD_TTL_MS,
          () => buildLeaderboardResponse(page, pageSize, search, sort, order)
        );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error(`[leaderboard:${type}] DB error:`, error);
    return NextResponse.json(
      { error: type === "towns" ? "Failed to fetch town ranking" : "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

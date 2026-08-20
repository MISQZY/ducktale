import { withDb } from "@/lib/db";
import { siteDb } from "@/lib/site-db";
import { withCache } from "@/lib/query-cache";
import { assembleResidents, townBaseQuery, type ResidentRow } from "@/lib/towny";
import { Prisma } from "@prisma/client";
import { FALLBACK_NICKNAME, PLAYER_NICKNAME_JOIN, resolveNicknames } from "@/lib/players";
import { resolveSkinUrls } from "@/lib/skin";
import { isUserOnline } from "@/lib/presence";
import type { LeaderboardResponse } from "@/types/leaderboard";
import type { RankedTown, TownRankingResponse } from "@/types/town-ranking";
import type { LocalizedName } from "@/lib/i18n-name";

export type { RankedTown, TownRankingResponse };

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
  let orderSql = Prisma.sql`ORDER BY sub.playtimeMs DESC, sub.uuid ASC`;
  const dir = order === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  switch (sort) {
    case "rank":
      // rank ASC is the same as playtimeMs DESC
      orderSql = Prisma.sql`ORDER BY sub.playtimeMs ${order === "desc" ? Prisma.sql`ASC` : Prisma.sql`DESC`}, sub.uuid ASC`;
      break;
    case "player":
      orderSql = Prisma.sql`ORDER BY sub.name ${dir}, sub.uuid ASC`;
      break;
    case "playtime":
      orderSql = Prisma.sql`ORDER BY sub.playtimeMs ${dir}, sub.uuid ASC`;
      break;
  }

  const { rows, total } = await withDb(async (db) => {
    const countRow = await db.$queryRaw(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM fp_player p
      LEFT JOIN fp_setting s ON s.player = p.id AND s.type = 'NICKNAME'
      INNER JOIN fp_time t ON t.player = p.id
      WHERE p.uuid NOT IN ('00000000-0000-0000-0000-000000000000', '0000-0000-0000-0000')
      ${search ? Prisma.sql`AND (p.name LIKE ${"%" + search + "%"} OR s.value LIKE ${"%" + search + "%"})` : Prisma.empty}
    `) as { total: bigint }[];
    const total = countRow.length > 0 ? Number(countRow[0].total) : 0;

    const rows = total === 0 ? [] : await db.$queryRaw(Prisma.sql`
      SELECT sub.*
      FROM (
        SELECT
          p.uuid,
          p.name,
          s.value AS nickname,
          t.total AS playtimeMs,
          p.online AS online,
          (SELECT COUNT(*) + 1 FROM fp_time t2 INNER JOIN fp_player p2 ON t2.player = p2.id WHERE t2.total > t.total AND p2.uuid NOT IN ('00000000-0000-0000-0000-000000000000', '0000-0000-0000-0000')) AS \`rank\`
        ${PLAYER_NICKNAME_JOIN}
        INNER JOIN fp_time t ON t.player = p.id
        WHERE p.uuid NOT IN ('00000000-0000-0000-0000-000000000000', '0000-0000-0000-0000')
        ${search ? Prisma.sql`AND (p.name LIKE ${"%" + search + "%"} OR s.value LIKE ${"%" + search + "%"})` : Prisma.empty}
      ) sub
      ${orderSql}
      LIMIT  ${pageSize}
      OFFSET ${offset}
    `) as RawPlayerRow[];

    return { rows, total };
  });

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
        badges: displayBadge ? [{ ...displayBadge, name: displayBadge.name as unknown as LocalizedName }] : [],
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

/**
 * Cached, ready-to-serve player leaderboard page — the same function backs
 * both /api/leaderboard's GET handler and LeaderboardPage's server-side
 * prefetch of page 1 (see src/app/[lang]/(main)/leaderboard/page.tsx), so a
 * fresh page load's first request and the client's own first fetch land on
 * the exact same withCache key and never do the work twice.
 */
export async function getLeaderboardPlayersPage(
  page: number, pageSize: number, search: string, sort: string, order: string
): Promise<LeaderboardResponse> {
  return withCache(
    `leaderboard:players:${page}:${pageSize}:${search.toLowerCase()}:${sort}:${order}`,
    LEADERBOARD_TTL_MS,
    () => buildLeaderboardResponse(page, pageSize, search, sort, order)
  );
}

/** Same idea as getLeaderboardPlayersPage, for the town ranking. */
export async function getTownRankingPage(
  page: number, pageSize: number, search: string, sort: string, order: string
): Promise<TownRankingResponse> {
  return withCache(
    `leaderboard:towns:${page}:${pageSize}:${search.toLowerCase()}:${sort}:${order}`,
    TOWN_RANKING_TTL_MS,
    () => buildTownRankingResponse(page, pageSize, search, sort, order)
  );
}

import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { townBaseQuery } from "@/lib/towny";
import { Prisma } from "@prisma/client";
import { isRateLimited } from "@/lib/rate-limit";
import type { RankedTown, TownRankingResponse } from "@/types/town-ranking";

export type { RankedTown, TownRankingResponse };

interface RawRow {
  name:      string;
  tag:       string | null;
  nation:    string | null;
  nationTag: string | null;
  size:      bigint;
  rank:      bigint;
  total:     bigint;
}

const TOWN_RANKING_TTL_MS = 60_000;

/**
 * Ranked by town size (claimed TOWNY_TOWNBLOCKS count) — the same metric
 * /api/towns already sorts by for the docs page, just with an explicit
 * rank column here. Same rule as the player leaderboard: RANK() is
 * computed over the *unranked* inner query, then the search filter is
 * applied as an outer WHERE — a search still has to show each town's real
 * position in the full ranking, not its position among the search matches
 * (which is what a WHERE-before-RANK() would give).
 */
async function buildTownRankingResponse(
  page: number, pageSize: number, search: string, sort: string, order: string
): Promise<TownRankingResponse> {
  const offset = (page - 1) * pageSize;

  const rows: RawRow[] = await withDb("duckburg_towns", async (db) => {
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

      return await db.$queryRaw(Prisma.sql`
        SELECT outer2.name, outer2.tag, outer2.nation, outer2.nationTag, outer2.size, outer2.\`rank\`,
               COUNT(*) OVER() AS total
        FROM (
          SELECT inner1.*, RANK() OVER (ORDER BY inner1.size DESC) AS \`rank\`
          FROM (
            ${townBaseQuery()}
          ) inner1
        ) outer2
        ${search ? Prisma.sql`WHERE outer2.name LIKE ${"%" + search + "%"}` : Prisma.empty}
        ${orderSql}
        LIMIT  ${pageSize}
        OFFSET ${offset}
      `) as RawRow[];
  });

  const total = rows.length > 0 ? Number(rows[0].total) : 0;

  return {
    towns: rows.map((r) => ({
      name:      r.name,
      tag:       r.tag,
      nation:    r.nation,
      nationTag: r.nationTag,
      size:      Number(r.size),
      rank:      Number(r.rank),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function GET(req: Request) {
  if (isRateLimited(req, "leaderboard-towns", 30, 60_000)) {
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
      `leaderboard-towns:${page}:${pageSize}:${search.toLowerCase()}:${sort}:${order}`,
      TOWN_RANKING_TTL_MS,
      () => buildTownRankingResponse(page, pageSize, search, sort, order)
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[leaderboard-towns] DB error:", error);
    return NextResponse.json(
      { error: "Failed to fetch town ranking" },
      { status: 500 }
    );
  }
}

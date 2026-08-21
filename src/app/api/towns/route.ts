import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { assembleResidents, townBaseQuery, type ResidentRow } from "@/lib/towny";
import { Prisma } from "@prisma/client";
import { FALLBACK_NICKNAME, resolveNicknames } from "@/lib/players";
import { resolveSkinUrls } from "@/lib/skin";
import { isRateLimited } from "@/lib/rate-limit";
import type { Town, TownyResponse } from "@/types/towny";

export type { Town, TownyResponse };

interface TownRow {
  name:      string;
  tag:       string | null;
  uuid:      string;
  mayorUuid: string | null;
  nation:    string | null;
  nationTag: string | null;
  size:      bigint;
  total:     bigint;
}

// The full town+resident+nickname assembly below is 3 sequential DB
// round-trips across 2 databases — cache the whole response per (page,
// search) combo so repeat requests within the window skip all of it.
const TOWNS_TTL_MS = 60_000;

async function buildTownsResponse(page: number, pageSize: number, search: string, sort: string, order: string): Promise<TownyResponse> {
  const offset = (page - 1) * pageSize;

  let orderSql = Prisma.sql`ORDER BY sub.size DESC`;
  const dir = order === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  switch (sort) {
    case "town":
      orderSql = Prisma.sql`ORDER BY sub.name ${dir}`;
      break;
    case "mayor":
      orderSql = Prisma.sql`ORDER BY sub.mayor ${dir}`;
      break;
    case "nation":
      orderSql = Prisma.sql`ORDER BY sub.nation ${dir}`;
      break;
    case "size":
      orderSql = Prisma.sql`ORDER BY sub.size ${dir}`;
      break;
  }

  const { townRows, residentRows, total } = await withDb("duckburg_towns", async (db) => {
    // COUNT(*) OVER() folds the total-count query into the same pass as the
    // page query — townBaseQuery's correlated subquery over ALL towns used
    // to run twice per request (see buildTownRankingResponse in
    // leaderboard-data.ts, which already used this pattern).
    const townRows = await db.$queryRaw(Prisma.sql`
      SELECT sub.*, COUNT(*) OVER() AS total
      FROM (
        ${townBaseQuery(Prisma.sql`, t.uuid AS uuid, t.mayor AS mayorUuid`)}
      ) sub
      ${search ? Prisma.sql`WHERE sub.name LIKE ${"%" + search + "%"}` : Prisma.empty}
      ${orderSql}
      LIMIT ${pageSize} OFFSET ${offset}
    `) as TownRow[];
    const total = townRows.length > 0 ? Number(townRows[0].total) : 0;

    const townUuids = townRows.map((t) => t.uuid);
    const residentRows = townUuids.length === 0 ? [] : await db.$queryRaw(Prisma.sql`
      SELECT r.name AS name, r.uuid AS uuid, r.town AS town, r.\`town-ranks\` AS ranks
      FROM TOWNY_RESIDENTS r
      WHERE r.town IN (${Prisma.join(townUuids)})
    `) as ResidentRow[];

    return { townRows, residentRows, total };
  });

  const [nicknames, skinUrlList] = await Promise.all([
    resolveNicknames(residentRows.map((r) => r.name)),
    resolveSkinUrls(residentRows.map((r) => r.uuid)),
  ]);
  const skinUrls = new Map(residentRows.map((r, i) => [r.uuid, skinUrlList[i]]));

  const residentsByTown = new Map<string, ResidentRow[]>();
  for (const r of residentRows) {
    const list = residentsByTown.get(r.town) ?? [];
    list.push(r);
    residentsByTown.set(r.town, list);
  }

  const result: TownyResponse = {
    towns: townRows.map((t): Town => ({
      name:      t.name,
      tag:       t.tag,
      nation:    t.nation,
      nationTag: t.nationTag,
      size:      Number(t.size),
      residents: assembleResidents(residentsByTown.get(t.uuid) ?? [], t.mayorUuid, nicknames, FALLBACK_NICKNAME, skinUrls),
    })),
    total, page, pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };

  return result;
}

export async function GET(req: Request) {
  if (isRateLimited(req, "towns", 30, 60_000)) {
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
      `towns:${page}:${pageSize}:${search.toLowerCase()}:${sort}:${order}`,
      TOWNS_TTL_MS,
      () => buildTownsResponse(page, pageSize, search, sort, order)
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("[towns] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch towns" }, { status: 500 });
  }
}

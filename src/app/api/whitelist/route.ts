import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { Prisma } from "@prisma/client";
import { isRateLimited } from "@/lib/rate-limit";
import type { WhitelistPlayer, WhitelistResponse } from "@/types/whitelist";

export type { WhitelistPlayer, WhitelistResponse };

interface RawRow {
  id:        bigint;
  name:      string;
  uuid:      string;
  addedAt:   bigint;
  duration:  bigint;
  moderator: string;
  total:     bigint;
}

const WHITELIST_TTL_MS = 60_000;

async function buildWhitelistResponse(
  page: number, pageSize: number, search: string, serverId: string,
  sort: string, order: string
): Promise<WhitelistResponse> {
  const offset = (page - 1) * pageSize;

  let orderSql = Prisma.sql`ORDER BY p.name ASC`;
  const dir = order === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  switch (sort) {
    case "id":
      orderSql = Prisma.sql`ORDER BY p.id ${dir}`;
      break;
    case "name":
      orderSql = Prisma.sql`ORDER BY p.name ${dir}`;
      break;
    case "moderator":
      orderSql = Prisma.sql`ORDER BY moderator ${dir}`;
      break;
    case "addedAt":
      orderSql = Prisma.sql`ORDER BY addedAt ${dir}`;
      break;
    case "expiresAt":
      orderSql = Prisma.sql`ORDER BY duration ${dir}`;
      break;
  }

  const rows: RawRow[] = await withDb(async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT
        p.id,
        p.name,
        p.uuid,
        m.date AS addedAt,
        m.time AS duration,
        COALESCE(mod_player.name, CAST(m.moderator AS CHAR)) AS moderator,
        COUNT(*) OVER() AS total
      FROM fp_player p
      INNER JOIN fp_moderation m
        ON  m.player = p.id
        AND m.type   = 'whitelist'
        AND m.valid  = 1
        ${serverId ? Prisma.sql`AND m.server = ${serverId}` : Prisma.empty}
        AND m.date   = (
          SELECT MAX(m2.date)
            FROM fp_moderation m2
           WHERE m2.player = p.id
             AND m2.type   = 'whitelist'
             AND m2.valid  = 1
             ${serverId ? Prisma.sql`AND m2.server = ${serverId}` : Prisma.empty}
        )
      LEFT JOIN fp_player mod_player
        ON mod_player.id = m.moderator
      ${search ? Prisma.sql`WHERE p.name LIKE ${"%" + search + "%"}` : Prisma.empty}
      ${orderSql}
      LIMIT  ${pageSize}
      OFFSET ${offset}
    `) as RawRow[];
  });

  const total = rows.length > 0 ? Number(rows[0].total) : 0;

  return {
    players: rows.map((r) => {
      const addedAt  = Number(r.addedAt);
      const duration = Number(r.duration);
      return {
        id:        Number(r.id),
        name:      r.name,
        uuid:      r.uuid,
        addedAt,
        expiresAt: duration > 0 ? addedAt + duration : 0,
        moderator: r.moderator,
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function GET(req: Request) {
  if (isRateLimited(req, "whitelist", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);

  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1",  10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const search   = searchParams.get("search")?.trim() ?? "";
  const serverId = searchParams.get("serverId")?.trim() ?? "";
  const sort     = searchParams.get("sort")?.trim() ?? "";
  const order    = searchParams.get("order")?.trim() ?? "";

  try {
    const result = await withCache(
      `whitelist:${page}:${pageSize}:${search.toLowerCase()}:${serverId}:${sort}:${order}`,
      WHITELIST_TTL_MS,
      () => buildWhitelistResponse(page, pageSize, search, serverId, sort, order)
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[whitelist] DB error:", error);
    return NextResponse.json(
      { error: "Failed to fetch whitelist" },
      { status: 500 }
    );
  }
}
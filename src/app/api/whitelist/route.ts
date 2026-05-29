import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface WhitelistPlayer {
  id:        number;
  name:      string;
  uuid:      string;
  addedAt:   number;
  expiresAt: number; // 0 = permanent
  moderator: string;
}

export interface WhitelistResponse {
  players:    WhitelistPlayer[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

interface RawRow {
  id:        bigint;
  name:      string;
  uuid:      string;
  addedAt:   bigint;
  duration:  bigint;
  moderator: string;
  total:     bigint;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page     = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const search   = searchParams.get("search")?.trim() ?? "";
  const serverId = searchParams.get("serverId")?.trim() ?? "";

  const offset = (page - 1) * pageSize;

  try {
    const rows = await withDb((db) =>
      db.$queryRaw<RawRow[]>(Prisma.sql`
        SELECT
          p.id,
          p.name,
          p.uuid,
          m.date                                                AS addedAt,
          m.time                                                AS duration,
          COALESCE(mod_player.name, CAST(m.moderator AS CHAR)) AS moderator,
          COUNT(*) OVER()                                       AS total
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
        ORDER BY p.name ASC
        LIMIT  ${pageSize}
        OFFSET ${offset}
      `)
    );

    const total = rows.length > 0 ? Number(rows[0].total) : 0;

    const result: WhitelistResponse = {
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

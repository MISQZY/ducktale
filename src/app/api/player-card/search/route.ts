import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { Prisma } from "@prisma/client";
import type { PlayerSearchResponse, PlayerSuggestion } from "@/types/player-card";

export type { PlayerSearchResponse, PlayerSuggestion };

const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 8;
const SUGGESTIONS_TTL_MS = 30_000;

async function findSuggestions(q: string): Promise<PlayerSuggestion[]> {
  return withDb(async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT p.name, s.value AS nickname
      FROM fp_player p
      LEFT JOIN fp_setting s ON s.player = p.id AND s.type = 'NICKNAME'
      WHERE p.name LIKE ${"%" + q + "%"} OR s.value LIKE ${"%" + q + "%"}
      ORDER BY (LOWER(p.name) = LOWER(${q}) OR LOWER(s.value) = LOWER(${q})) DESC, p.name ASC
      LIMIT ${MAX_RESULTS}
    `) as PlayerSuggestion[];
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json<PlayerSearchResponse>({ results: [] });
  }

  try {
    const rows = await withCache(`suggest:${q.toLowerCase()}`, SUGGESTIONS_TTL_MS, () => findSuggestions(q));

    return NextResponse.json<PlayerSearchResponse>({ results: rows }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15" },
    });
  } catch (error) {
    console.error("[player-card/search] DB error:", error);
    return NextResponse.json({ error: "Failed to search players" }, { status: 500 });
  }
}

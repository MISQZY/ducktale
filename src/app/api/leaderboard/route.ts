import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getLeaderboardPlayersPage, getTownRankingPage } from "@/lib/leaderboard-data";
import type { LeaderboardPlayer, LeaderboardResponse } from "@/types/leaderboard";
import type { RankedTown, TownRankingResponse } from "@/types/town-ranking";

export type { LeaderboardPlayer, LeaderboardResponse, RankedTown, TownRankingResponse };

/**
 * One endpoint for every ranking category, selected by `?type=` — same
 * shape as pagination's `?page=`: a single route parameterized by a query
 * argument instead of a separate route per category. `players` (default)
 * and `towns` share the pagination/search/sort/order query contract, even
 * though they hit different databases underneath. The actual query-building
 * and caching lives in src/lib/leaderboard-data.ts, shared with
 * LeaderboardPage's server-side prefetch of page 1.
 */
type LeaderboardType = "players" | "towns";

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
      ? await getTownRankingPage(page, pageSize, search, sort, order)
      : await getLeaderboardPlayersPage(page, pageSize, search, sort, order);

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

import { NextResponse } from "next/server";
import { hasFreshCache } from "@/lib/query-cache";
import { isRateLimited } from "@/lib/rate-limit";
import { getPlayerCard, IDENTITY_SEARCH_TTL_MS, MIN_SEARCH_LENGTH } from "@/lib/player-card";
import type { PlayerCard, PlayerCardResponse } from "@/types/player-card";

export type { PlayerCard, PlayerCardResponse };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";

  if (search && search.length < MIN_SEARCH_LENGTH) {
    return NextResponse.json<PlayerCardResponse>({ player: null });
  }

  // A request for an already-cached, specific player (e.g. repeatedly
  // reloading a profile page) doesn't touch the database at all, so it
  // shouldn't be spent against the same limit as one that does — otherwise
  // rate limiting itself becomes the thing that makes an already-cached
  // page intermittently fail to load.
  const identityCached = search && hasFreshCache(`identity:${search.toLowerCase()}`, IDENTITY_SEARCH_TTL_MS);
  if (!identityCached && isRateLimited(req, "player-card", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const player = await getPlayerCard(search);

    return NextResponse.json<PlayerCardResponse>({ player }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15" },
    });
  } catch (error) {
    console.error("[player-card] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}

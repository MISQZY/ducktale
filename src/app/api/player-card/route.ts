import { NextResponse } from "next/server";
import { hasFreshCache, invalidateByPrefix } from "@/lib/query-cache";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getPlayerCard, IDENTITY_SEARCH_TTL_MS, IDENTITY_RANDOM_TTL_MS, RANDOM_IDENTITY_CACHE_KEY, MIN_SEARCH_LENGTH,
} from "@/lib/player-card";
import type { PlayerCard, PlayerCardResponse } from "@/types/player-card";

export type { PlayerCard, PlayerCardResponse };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  // Set only by the docs card's refresh button (never on a plain page load)
  // to force a genuinely new random pick — see the cache-bust below.
  const forceRandom = !search && searchParams.get("refresh") === "1";

  if (search && search.length < MIN_SEARCH_LENGTH) {
    return NextResponse.json<PlayerCardResponse>({ player: null });
  }

  // An explicit refresh click must always change who's shown, so it can't
  // reuse whatever this TTL window last served — bust it before the
  // cache-freshness check below, so this request both counts against the
  // rate limit (it's a real DB hit) and actually returns someone new.
  if (forceRandom) invalidateByPrefix(RANDOM_IDENTITY_CACHE_KEY);

  // A request for an already-cached identity — a specific player (e.g.
  // repeatedly reloading a profile page) or the current random pick (e.g.
  // two people loading the docs page within the same few-second window) —
  // doesn't touch the database at all, so it shouldn't be spent against the
  // same limit as one that does. Otherwise rate limiting itself becomes the
  // thing that makes an already-cached page intermittently fail to load.
  const identityCacheKey = search ? `identity:${search.toLowerCase()}` : RANDOM_IDENTITY_CACHE_KEY;
  const identityCacheTtl = search ? IDENTITY_SEARCH_TTL_MS : IDENTITY_RANDOM_TTL_MS;
  const identityCached = hasFreshCache(identityCacheKey, identityCacheTtl);
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

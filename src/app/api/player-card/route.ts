import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { resolveResidentRole } from "@/lib/towny";
import { Prisma } from "@prisma/client";
import { SERVERS } from "@/config/servers";
import type { Gender, GrowthStatus, PlayerCard, PlayerCardResponse } from "@/types/player-card";
import type { ResidentRole } from "@/types/towny";

export type { PlayerCard, PlayerCardResponse };

const FALLBACK_NICKNAME = "Путник";

// The player card only ever draws Towny/growth/skin data from DuckBurg's
// databases, so "whitelisted" specifically means whitelisted on DuckBurg —
// an fp_moderation whitelist entry issued for a different server shouldn't
// count.
const DUCKBURG_SERVER_UUID = SERVERS.find((s) => s.id === "duckburg")!.uuid;

// Per-uuid data (growth, skin, town/nation) changes on the order of minutes,
// not seconds — cache it to avoid re-querying 3 separate databases on every
// card view. Identity search results get a much shorter TTL (matching the
// route's own Cache-Control) since name/nickname/playtime are more dynamic
// and cheap to look up. The *random* identity pick is deliberately never
// cached — caching it would make every visitor see the same "random" player
// for the whole TTL window, defeating the point.
const GROWTH_TTL_MS = 5 * 60_000;
const SKIN_TTL_MS   = 10 * 60_000;
const TOWNY_TTL_MS  = 3 * 60_000;
const IDENTITY_SEARCH_TTL_MS = 60_000;

interface IdentityRow {
  id:          number;
  uuid:        string;
  name:        string;
  nickname:    string | null;
  playtimeMs:  bigint | null;
  online:      number | boolean; // raw MySQL boolean from fp_player.online — 0/1, not a JS boolean
  lastSeenMs:  bigint | null;
  whitelisted: number | boolean; // raw MySQL boolean from EXISTS(...) — 0/1, not a JS boolean
}

const WHITELIST_EXISTS = Prisma.sql`
  EXISTS (
    SELECT 1 FROM fp_moderation m
    WHERE m.player = p.id AND m.type = 'whitelist' AND m.valid = 1
      AND m.server = ${DUCKBURG_SERVER_UUID}
  )
`;

/** Resolves the target player (by search, or a random player) from every player in the default DB — not just whitelisted ones. */
async function resolveIdentity(search: string): Promise<IdentityRow | null> {
  if (search) {
    return withCache(`identity:${search.toLowerCase()}`, IDENTITY_SEARCH_TTL_MS, () => resolveIdentityUncached(search));
  }
  return resolveIdentityUncached(search);
}

async function resolveIdentityUncached(search: string): Promise<IdentityRow | null> {
  return withDb(async (db) => {
    const rows = search
      ? await db.$queryRaw(Prisma.sql`
          SELECT p.id, p.uuid, p.name, s.value AS nickname, t.total AS playtimeMs,
                 p.online AS online, t.last AS lastSeenMs,
                 ${WHITELIST_EXISTS} AS whitelisted
          FROM fp_player p
          LEFT JOIN fp_setting s ON s.player = p.id AND s.type = 'NICKNAME'
          LEFT JOIN fp_time t ON t.player = p.id
          WHERE p.name LIKE ${"%" + search + "%"} OR s.value LIKE ${"%" + search + "%"}
          ORDER BY (LOWER(p.name) = LOWER(${search}) OR LOWER(s.value) = LOWER(${search})) DESC, p.name ASC
          LIMIT 1
        `)
      : await db.$queryRaw(Prisma.sql`
          SELECT p.id, p.uuid, p.name, s.value AS nickname, t.total AS playtimeMs,
                 p.online AS online, t.last AS lastSeenMs,
                 ${WHITELIST_EXISTS} AS whitelisted
          FROM fp_player p
          LEFT JOIN fp_setting s ON s.player = p.id AND s.type = 'NICKNAME'
          LEFT JOIN fp_time t ON t.player = p.id
          ORDER BY RAND()
          LIMIT 1
        `);

    const [row] = rows as IdentityRow[];
    return row ?? null;
  });
}

/** Gender + growth status from the FlectoneGrowth ("newbie") database. */
async function resolveGrowthData(uuid: string): Promise<{ gender: Gender; growth: GrowthStatus }> {
  return withCache(`growth:${uuid}`, GROWTH_TTL_MS, () => resolveGrowthDataUncached(uuid));
}

async function resolveGrowthDataUncached(uuid: string): Promise<{ gender: Gender; growth: GrowthStatus }> {
  const [row] = await withDb("duckburg_newbie", async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT
        g.gender_key AS genderKey,
        gt.growth_seconds AS growthSeconds,
        (SELECT COALESCE(SUM(pt.total_seconds), 0) FROM flectonegrowth_playtime pt WHERE pt.player_id = fp.id) AS growthPlaytimeSeconds
      FROM flectonegrowth_player fp
      LEFT JOIN flectonegrowth_genders g ON g.player_id = fp.id
      LEFT JOIN flectonegrowth_growth_time gt ON gt.player_id = fp.id
      WHERE fp.uuid = ${uuid}
      LIMIT 1
    `) as { genderKey: string | null; growthSeconds: bigint | null; growthPlaytimeSeconds: bigint | null }[];
  });

  const gender: Gender = row?.genderKey === "male" || row?.genderKey === "female" ? row.genderKey : null;

  // growth_seconds is a fixed target: growth is complete once the player's
  // accumulated growth-tracked playtime reaches it. flectonegrowth_scales
  // was tried as the completion signal first, but it's unreliable — several
  // players are well past their threshold with no scales row at all, or with
  // valid=1 despite being 2x over target, so it can't be trusted here.
  let growth: GrowthStatus = { state: "unknown" };
  if (row?.growthSeconds !== null && row?.growthSeconds !== undefined) {
    const target = Number(row.growthSeconds);
    const played = Number(row.growthPlaytimeSeconds ?? 0);
    growth = played >= target
      ? { state: "complete" }
      : { state: "growing", secondsRemaining: target - played };
  }

  return { gender, growth };
}

interface SkinConfig {
  skin_identifier: string | null;
  skin_type:       string | null;
  skin_variant:    string | null;
}

/**
 * Resolves the player's current skin texture URL from the SkinRestorer
 * database. Most players (~93% on this server) have overridden their skin
 * via sr_players (skin_type: PLAYER/CUSTOM/URL) — sr_player_skins alone is
 * only their own cached Mojang skin and misses any of those overrides.
 */
async function resolveSkinUrl(uuid: string): Promise<string | null> {
  return withCache(`skin:${uuid}`, SKIN_TTL_MS, () => resolveSkinUrlUncached(uuid));
}

async function resolveSkinUrlUncached(uuid: string): Promise<string | null> {
  return withDb("duckburg_skinrestorer", async (db) => {
    const [config] = await db.$queryRaw(Prisma.sql`
      SELECT skin_identifier, skin_type, skin_variant FROM sr_players WHERE uuid = ${uuid} LIMIT 1
    `) as SkinConfig[];

    let valueRow: { value: string } | undefined;

    if (config?.skin_type === "URL" && config.skin_identifier) {
      [valueRow] = await db.$queryRaw(Prisma.sql`
        SELECT value FROM sr_url_skins
        WHERE url = ${config.skin_identifier}
        ${config.skin_variant ? Prisma.sql`AND skin_variant = ${config.skin_variant}` : Prisma.empty}
        LIMIT 1
      `) as { value: string }[];
    } else if (config?.skin_type === "CUSTOM" && config.skin_identifier) {
      [valueRow] = await db.$queryRaw(Prisma.sql`
        SELECT value FROM sr_custom_skins WHERE name = ${config.skin_identifier} LIMIT 1
      `) as { value: string }[];
    } else if (config?.skin_type === "PLAYER" && config.skin_identifier) {
      [valueRow] = await db.$queryRaw(Prisma.sql`
        SELECT value FROM sr_player_skins WHERE uuid = ${config.skin_identifier} LIMIT 1
      `) as { value: string }[];
    } else {
      [valueRow] = await db.$queryRaw(Prisma.sql`
        SELECT value FROM sr_player_skins WHERE uuid = ${uuid} LIMIT 1
      `) as { value: string }[];
    }

    if (!valueRow) return null;

    try {
      const decoded = JSON.parse(Buffer.from(valueRow.value, "base64").toString("utf-8"));
      return decoded?.textures?.SKIN?.url ?? null;
    } catch {
      return null;
    }
  });
}

interface TownyRow {
  city:      string | null;
  nation:    string | null;
  mayorUuid: string | null;
  ranks:     string | null;
}

/** City (Towny town), nationality (Towny nation), and the resident's role within their town. */
async function resolveTownyData(uuid: string): Promise<{ city: string | null; nation: string | null; role: ResidentRole }> {
  return withCache(`towny:${uuid}`, TOWNY_TTL_MS, () => resolveTownyDataUncached(uuid));
}

async function resolveTownyDataUncached(uuid: string): Promise<{ city: string | null; nation: string | null; role: ResidentRole }> {
  const [row] = await withDb("duckburg_towns", async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT t.name AS city, n.name AS nation, t.mayor AS mayorUuid, r.\`town-ranks\` AS ranks
      FROM TOWNY_RESIDENTS r
      LEFT JOIN TOWNY_TOWNS t ON t.uuid = r.town
      LEFT JOIN TOWNY_NATIONS n ON n.uuid = t.nation
      WHERE r.uuid = ${uuid}
      LIMIT 1
    `) as TownyRow[];
  });

  return {
    city:   row?.city ?? null,
    nation: row?.nation ?? null,
    role:   row?.city ? resolveResidentRole(uuid, row.mayorUuid, row.ranks) : null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";

  try {
    const identity = await resolveIdentity(search);
    if (!identity) {
      return NextResponse.json<PlayerCardResponse>({ player: null });
    }

    const [{ gender, growth }, skinUrl, { city, nation, role }] = await Promise.all([
      resolveGrowthData(identity.uuid),
      resolveSkinUrl(identity.uuid),
      resolveTownyData(identity.uuid),
    ]);

    const player: PlayerCard = {
      username:   identity.name,
      nickname:   identity.nickname ?? FALLBACK_NICKNAME,
      skinUrl,
      playtimeMs: Number(identity.playtimeMs ?? 0),
      // $queryRaw returns MySQL's EXISTS(...)/boolean result as a plain 0/1
      // number, not a JS boolean — coerce explicitly (see the growth-status
      // bug this exact gotcha caused earlier).
      online:     Boolean(identity.online),
      lastSeenMs: Number(identity.lastSeenMs ?? 0),
      gender,
      growth,
      city,
      nation,
      role,
      whitelisted: Boolean(identity.whitelisted),
    };

    return NextResponse.json<PlayerCardResponse>({ player }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15" },
    });
  } catch (error) {
    console.error("[player-card] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}

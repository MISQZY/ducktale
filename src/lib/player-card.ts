import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { resolveResidentRole } from "@/lib/towny";
import { resolveSkinUrl } from "@/lib/skin";
import { Prisma } from "@prisma/client";
import { SERVERS, NETWORK_SERVERS } from "@/config/servers";
import { FALLBACK_NICKNAME, PLAYER_NICKNAME_JOIN } from "@/lib/players";
import type { Gender, GrowthStatus, PlayerCard, PlayerServerStatus } from "@/types/player-card";
import type { ResidentRole } from "@/types/towny";

// The single top-level `whitelisted` field only ever draws from DuckBurg —
// an fp_moderation whitelist entry issued for a different server shouldn't
// count there (used by the docs search card's checkmark). The per-server
// `servers` breakdown below covers every server generically. Resolved
// lazily (not at module scope) so a missing config entry fails the one
// request that needs it instead of crashing the whole route module at
// import time.
function getDuckburgServerUuid(): string {
  const server = SERVERS.find((s) => s.id === "duckburg");
  if (!server) {
    throw new Error('Player card route requires a "duckburg" entry in SERVERS config');
  }
  return server.uuid;
}

/**
 * One EXISTS(...) AS whitelisted_<serverId> column per network server
 * (including technical ones like Hub, not just the public-facing SERVERS
 * list) — server ids are our own config, not user input, so Prisma.raw is
 * safe here.
 */
function perServerWhitelistColumnsSql() {
  return Prisma.join(
    NETWORK_SERVERS.map(
      (server) => Prisma.sql`
        EXISTS (
          SELECT 1 FROM fp_moderation m
          WHERE m.player = p.id AND m.type = 'whitelist' AND m.valid = 1
            AND m.server = ${server.uuid}
        ) AS ${Prisma.raw(`whitelisted_${server.id}`)}
      `
    ),
    ", "
  );
}

function readPerServerWhitelist(row: IdentityRow): Record<string, boolean> {
  return Object.fromEntries(
    NETWORK_SERVERS.map((server) => [server.id, Boolean(row[`whitelisted_${server.id}`])])
  );
}

/** Towny (city/nation/role) is only tracked for DuckBurg — see resolveTownyData's own DuckBurg-only database connection. */
function buildServerStatuses(
  identity: IdentityRow,
  towny: { city: string | null; nation: string | null; role: ResidentRole }
): PlayerServerStatus[] {
  const whitelistByServer = readPerServerWhitelist(identity);
  // Gated on the global online flag, not just "currentServerId is set" —
  // fp_setting's SERVER value is left over from the player's last session
  // once they log off, so trusting it alone would show a stale "online
  // here" badge for an offline player.
  const isOnline = Boolean(identity.online);
  return NETWORK_SERVERS.map((server) => ({
    serverId: server.id,
    whitelisted: whitelistByServer[server.id] ?? false,
    online: isOnline && identity.currentServerId === server.uuid,
    city: server.id === "duckburg" ? towny.city : null,
    nation: server.id === "duckburg" ? towny.nation : null,
    role: server.id === "duckburg" ? towny.role : null,
  }));
}

// Per-uuid data (growth, skin, town/nation) changes on the order of minutes,
// not seconds — cache it to avoid re-querying 3 separate databases on every
// card view. Identity search results get a much shorter TTL (matching the
// route's own Cache-Control) since name/nickname/playtime are more dynamic
// and cheap to look up.
const GROWTH_TTL_MS = 5 * 60_000;
const TOWNY_TTL_MS  = 3 * 60_000;
export const IDENTITY_SEARCH_TTL_MS = 60_000;
// The *random* identity pick gets a much shorter TTL than a real search —
// long enough to absorb a burst of rapid page reloads (each one otherwise
// re-running the random pick plus 3 more per-UUID DB queries, since a new
// random UUID almost never hits the growth/skin/towny caches either), short
// enough that it still rotates to a new random player every few seconds
// instead of showing the same "random" pick to everyone for a whole minute.
const IDENTITY_RANDOM_TTL_MS = 5_000;

// Matches the /api/player-card/search suggestions endpoint's minimum — also
// keeps single/double-character queries (cheap to spam, each landing its own
// cache entry) from wearing down the identity-search cache.
export const MIN_SEARCH_LENGTH = 3;

interface IdentityRow {
  id:               number;
  uuid:             string;
  name:             string;
  nickname:         string | null;
  playtimeMs:       bigint | null;
  online:           number | boolean; // raw MySQL boolean from fp_player.online — 0/1, not a JS boolean
  lastSeenMs:       bigint | null;
  whitelisted:      number | boolean; // raw MySQL boolean from EXISTS(...) — 0/1, not a JS boolean
  currentServerId:  string | null; // fp_setting type='SERVER' — which server they're on, only meaningful while `online` is true
  rank:             bigint; // 1-based position among all fp_time rows ordered by total DESC — see leaderboardRankSql()
  // Plus one `whitelisted_<serverId>` column per SERVERS entry (see
  // perServerWhitelistColumnsSql) — read via readPerServerWhitelist().
  [key: `whitelisted_${string}`]: number | boolean;
}

/**
 * A player with no fp_time row at all (COALESCE to 0) ranks behind everyone
 * who has one, same as the leaderboard's INNER JOIN excludes them entirely —
 * this just needs *a* rank to compare against, the exact value only matters
 * when it's low enough to display (see MAX_DISPLAYED_RANK).
 */
function leaderboardRankSql() {
  return Prisma.sql`
    (SELECT COUNT(*) + 1 FROM fp_time t2 WHERE t2.total > COALESCE(t.total, 0)) AS \`rank\`
  `;
}

const MAX_DISPLAYED_RANK = 10;

function whitelistExists() {
  return Prisma.sql`
    EXISTS (
      SELECT 1 FROM fp_moderation m
      WHERE m.player = p.id AND m.type = 'whitelist' AND m.valid = 1
        AND m.server = ${getDuckburgServerUuid()}
    )
  `;
}

/** Resolves the target player (by search, or a random player) from every player in the default DB — not just whitelisted ones. */
async function resolveIdentity(search: string): Promise<IdentityRow | null> {
  if (search) {
    return withCache(`identity:${search.toLowerCase()}`, IDENTITY_SEARCH_TTL_MS, () => resolveIdentityUncached(search));
  }
  return withCache("identity:__random__", IDENTITY_RANDOM_TTL_MS, () => resolveIdentityUncached(search));
}

async function resolveIdentityUncached(search: string): Promise<IdentityRow | null> {
  return withDb(async (db) => {
    const rows = search
      ? await db.$queryRaw(Prisma.sql`
          SELECT p.id, p.uuid, p.name, s.value AS nickname, t.total AS playtimeMs,
                 p.online AS online, t.last AS lastSeenMs, srv.value AS currentServerId,
                 ${whitelistExists()} AS whitelisted,
                 ${leaderboardRankSql()},
                 ${perServerWhitelistColumnsSql()}
          ${PLAYER_NICKNAME_JOIN}
          LEFT JOIN fp_time t ON t.player = p.id
          LEFT JOIN fp_setting srv ON srv.player = p.id AND srv.type = 'SERVER'
          WHERE p.name LIKE ${"%" + search + "%"} OR s.value LIKE ${"%" + search + "%"}
          ORDER BY (LOWER(p.name) = LOWER(${search}) OR LOWER(s.value) = LOWER(${search})) DESC, p.name ASC
          LIMIT 1
        `)
      : await db.$queryRaw(Prisma.sql`
          SELECT p.id, p.uuid, p.name, s.value AS nickname, t.total AS playtimeMs,
                 p.online AS online, t.last AS lastSeenMs, srv.value AS currentServerId,
                 ${whitelistExists()} AS whitelisted,
                 ${leaderboardRankSql()},
                 ${perServerWhitelistColumnsSql()}
          ${PLAYER_NICKNAME_JOIN}
          LEFT JOIN fp_time t ON t.player = p.id
          LEFT JOIN fp_setting srv ON srv.player = p.id AND srv.type = 'SERVER'
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

/**
 * Resolves a full player card — by search, or a random player when `search`
 * is empty. Shared by /api/player-card (the client-fetched search/random
 * widget in docs/PlayerCard.tsx) and Server Components that already know
 * exactly which player they want (the profile pages), so those can fetch
 * this server-side instead of round-tripping through their own API route.
 */
export async function getPlayerCard(search: string): Promise<PlayerCard | null> {
  const identity = await resolveIdentity(search);
  if (!identity) return null;

  const [{ gender, growth }, skinUrl, { city, nation, role }] = await Promise.all([
    resolveGrowthData(identity.uuid),
    resolveSkinUrl(identity.uuid),
    resolveTownyData(identity.uuid),
  ]);

  return {
    username:   identity.name,
    nickname:   identity.nickname ?? FALLBACK_NICKNAME,
    skinUrl,
    playtimeMs: Number(identity.playtimeMs ?? 0),
    rank:       Number(identity.rank) <= MAX_DISPLAYED_RANK ? Number(identity.rank) : null,
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
    servers: buildServerStatuses(identity, { city, nation, role }),
  };
}

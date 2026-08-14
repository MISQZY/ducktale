import { Prisma } from "@prisma/client";
import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";

// Per-uuid data changes on the order of minutes, not seconds — cache it to
// avoid re-querying on every request that needs a skin (player card,
// profile, nav avatar).
const SKIN_TTL_MS = 10 * 60_000;

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
export async function resolveSkinUrl(uuid: string): Promise<string | null> {
  return withCache(`skin:${uuid}`, SKIN_TTL_MS, () => resolveSkinUrlUncached(uuid));
}

async function resolvePlayerName(uuid: string): Promise<string | null> {
  const rows = await withDb("default", async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT name FROM fp_player WHERE uuid = ${uuid} LIMIT 1
    `) as { name: string }[];
  });
  return rows.length > 0 ? rows[0].name : null;
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
    }

    // Fallback only when there's no explicit override (or its lookup came up
    // empty). The cracked-player name lookup below hits a *second* database
    // (the default/FlectonePulse one, not SkinRestorer's) — it used to run
    // unconditionally before this override check, i.e. on every single call
    // including the ~93% that already resolved via an override above and
    // never needed the name at all. Fetching it lazily, only on this path,
    // cuts a whole extra cross-database round trip off the common case.
    if (!valueRow) {
      const name = await resolvePlayerName(uuid);
      [valueRow] = await db.$queryRaw(Prisma.sql`
        SELECT value FROM sr_player_skins
        WHERE uuid = ${uuid} ${name ? Prisma.sql`OR last_known_name = ${name}` : Prisma.empty}
        ORDER BY timestamp DESC
        LIMIT 1
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

/**
 * Resolves skin URLs for a list of UUIDs (a `null`/`undefined` slot — e.g. an
 * unlinked or unconfirmed account — resolves to `null` without a query),
 * chunked to keep concurrent SkinRestorer connections bounded.
 *
 * This is the one implementation of a pattern that used to be copy-pasted
 * per call site (leaderboard, admin users/tickets/badges/roles, homepage
 * showcase) — each with its own ad hoc chunk size (3 in some places, 5 in
 * others) picked with no shared rationale. `resolveSkinUrl` itself already
 * caches per uuid, so this only saves the boilerplate loop, not queries
 * beyond what each individual call would already make.
 */
export async function resolveSkinUrls(
  uuids: (string | null | undefined)[],
  chunkSize = 5
): Promise<(string | null)[]> {
  const results: (string | null)[] = [];
  for (let i = 0; i < uuids.length; i += chunkSize) {
    const chunk = uuids.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((uuid) => (uuid ? resolveSkinUrl(uuid) : Promise.resolve(null)))
    );
    results.push(...chunkResults);
  }
  return results;
}

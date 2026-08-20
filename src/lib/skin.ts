import { Prisma } from "@prisma/client";
import { withDb } from "@/lib/db";
import { withCache, hasFreshCache } from "@/lib/query-cache";

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
      SELECT name FROM fp_player WHERE uuid = ${uuid} AND uuid NOT IN ('00000000-0000-0000-0000-000000000000', '0000-0000-0000-0000') LIMIT 1
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
 * Same overrides-then-fallback logic as resolveSkinUrlUncached, but for a
 * whole batch of uuids at once — one IN (...) round trip per table instead
 * of resolveSkinUrl's up-to-3 sequential round trips *per uuid*. Only called
 * for uuids that already missed the cache (see resolveSkinUrls), so this
 * doesn't change anything about the caching behavior, just how the misses
 * are fetched.
 */
async function resolveSkinUrlsUncachedBatch(uuids: string[]): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();

  await withDb("duckburg_skinrestorer", async (db) => {
    const configs = await db.$queryRaw(Prisma.sql`
      SELECT uuid, skin_identifier, skin_type, skin_variant FROM sr_players WHERE uuid IN (${Prisma.join(uuids)})
    `) as (SkinConfig & { uuid: string })[];

    const urlConfigs = configs.filter((c) => c.skin_type === "URL" && c.skin_identifier);
    const customConfigs = configs.filter((c) => c.skin_type === "CUSTOM" && c.skin_identifier);
    const playerConfigs = configs.filter((c) => c.skin_type === "PLAYER" && c.skin_identifier);

    const [urlRows, customRows, playerSkinRows] = await Promise.all([
      urlConfigs.length > 0
        ? db.$queryRaw(Prisma.sql`
            SELECT url, skin_variant, value FROM sr_url_skins WHERE url IN (${Prisma.join(urlConfigs.map((c) => c.skin_identifier as string))})
          `) as Promise<{ url: string; skin_variant: string | null; value: string }[]>
        : Promise.resolve([]),
      customConfigs.length > 0
        ? db.$queryRaw(Prisma.sql`
            SELECT name, value FROM sr_custom_skins WHERE name IN (${Prisma.join(customConfigs.map((c) => c.skin_identifier as string))})
          `) as Promise<{ name: string; value: string }[]>
        : Promise.resolve([]),
      playerConfigs.length > 0
        ? db.$queryRaw(Prisma.sql`
            SELECT uuid, value FROM sr_player_skins WHERE uuid IN (${Prisma.join(playerConfigs.map((c) => c.skin_identifier as string))})
          `) as Promise<{ uuid: string; value: string }[]>
        : Promise.resolve([]),
    ]);

    const urlRowsByUrl = new Map<string, { url: string; skin_variant: string | null; value: string }[]>();
    for (const row of urlRows) {
      const list = urlRowsByUrl.get(row.url);
      if (list) list.push(row); else urlRowsByUrl.set(row.url, [row]);
    }
    const customValueByName = new Map(customRows.map((r) => [r.name, r.value]));
    const playerSkinValueByUuid = new Map<string, string>();
    for (const row of playerSkinRows) {
      if (!playerSkinValueByUuid.has(row.uuid)) playerSkinValueByUuid.set(row.uuid, row.value);
    }

    const overrideValueByUuid = new Map<string, string>();
    for (const config of configs) {
      if (config.skin_type === "URL" && config.skin_identifier) {
        const candidates = urlRowsByUrl.get(config.skin_identifier);
        const match = config.skin_variant
          ? candidates?.find((r) => r.skin_variant === config.skin_variant)
          : candidates?.[0];
        if (match) overrideValueByUuid.set(config.uuid, match.value);
      } else if (config.skin_type === "CUSTOM" && config.skin_identifier) {
        const value = customValueByName.get(config.skin_identifier);
        if (value) overrideValueByUuid.set(config.uuid, value);
      } else if (config.skin_type === "PLAYER" && config.skin_identifier) {
        const value = playerSkinValueByUuid.get(config.skin_identifier);
        if (value) overrideValueByUuid.set(config.uuid, value);
      }
    }

    // Same lazy fallback as the single-uuid path — only for uuids with no
    // override value above (missing config, or an override lookup miss).
    const fallbackUuids = uuids.filter((uuid) => !overrideValueByUuid.has(uuid));
    const fallbackValueByUuid = new Map<string, string>();

    if (fallbackUuids.length > 0) {
      const nameByUuid = await withDb("default", async (defaultDb) => {
        const rows = await defaultDb.$queryRaw(Prisma.sql`
          SELECT uuid, name FROM fp_player WHERE uuid IN (${Prisma.join(fallbackUuids)}) AND uuid NOT IN ('00000000-0000-0000-0000-000000000000', '0000-0000-0000-0000')
        `) as { uuid: string; name: string }[];
        return new Map(rows.map((r) => [r.uuid, r.name]));
      });

      const names = Array.from(nameByUuid.values());
      const fallbackRows = await db.$queryRaw(Prisma.sql`
        SELECT uuid, last_known_name, value FROM sr_player_skins
        WHERE uuid IN (${Prisma.join(fallbackUuids)})
        ${names.length > 0 ? Prisma.sql`OR last_known_name IN (${Prisma.join(names)})` : Prisma.empty}
        ORDER BY timestamp DESC
      `) as { uuid: string; last_known_name: string | null; value: string }[];

      for (const uuid of fallbackUuids) {
        const name = nameByUuid.get(uuid);
        const match = fallbackRows.find((r) => r.uuid === uuid || (!!name && r.last_known_name === name));
        if (match) fallbackValueByUuid.set(uuid, match.value);
      }
    }

    for (const uuid of uuids) {
      const raw = overrideValueByUuid.get(uuid) ?? fallbackValueByUuid.get(uuid);
      if (!raw) {
        result.set(uuid, null);
        continue;
      }
      try {
        const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
        result.set(uuid, decoded?.textures?.SKIN?.url ?? null);
      } catch {
        result.set(uuid, null);
      }
    }
  });

  return result;
}

/**
 * Resolves skin URLs for a list of UUIDs (a `null`/`undefined` slot — e.g. an
 * unlinked or unconfirmed account — resolves to `null` without a query).
 * Cache hits are read individually (resolveSkinUrl, cheap in-memory lookups);
 * everything still missing the cache is resolved in one batched round trip
 * via resolveSkinUrlsUncachedBatch instead of one resolveSkinUrl chain per
 * uuid — this used to be a sequential-chunks-of-5 loop, which meant up to 3
 * DB round trips *per uuid* on a cold cache (leaderboard, admin users/
 * tickets are exactly the pages that pay for that on every page load).
 *
 * This is the one implementation of a pattern that used to be copy-pasted
 * per call site (leaderboard, admin users/tickets/badges/roles, homepage
 * showcase).
 */
export async function resolveSkinUrls(
  uuids: (string | null | undefined)[]
): Promise<(string | null)[]> {
  const uncached = Array.from(
    new Set(
      uuids.filter((uuid): uuid is string => !!uuid && !hasFreshCache(`skin:${uuid}`, SKIN_TTL_MS))
    )
  );

  if (uncached.length > 0) {
    const resolved = await resolveSkinUrlsUncachedBatch(uncached);
    // Routed through withCache (not a direct cache write) so it shares the
    // same TTL/eviction bookkeeping as the single-uuid path — the fetcher
    // here is just returning an already-computed value, not querying again.
    await Promise.all(
      uncached.map((uuid) => withCache(`skin:${uuid}`, SKIN_TTL_MS, () => Promise.resolve(resolved.get(uuid) ?? null)))
    );
  }

  return Promise.all(uuids.map((uuid) => (uuid ? resolveSkinUrl(uuid) : Promise.resolve(null))));
}

/**
 * Same as resolveSkinUrls, but for callers that need to look a resolved
 * skin back up per-uuid afterwards (e.g. zipping it onto each of several
 * messages that share an author) rather than by array position. Dedupes to
 * one resolveSkinUrl per unique uuid regardless of how many times it
 * repeats in the input — shared by thread-data.ts/ticket-data.ts instead of
 * each re-deriving the same dedup-then-zip-into-a-Map steps.
 */
export async function resolveSkinUrlMap(
  uuids: (string | null | undefined)[]
): Promise<Map<string, string | null>> {
  const unique = Array.from(new Set(uuids.filter((u): u is string => !!u)));
  const skinUrls = await resolveSkinUrls(unique);
  return new Map(unique.map((u, i) => [u, skinUrls[i]]));
}

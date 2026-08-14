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

async function resolveSkinUrlUncached(uuid: string): Promise<string | null> {
  // Get the player's name from the main DB, since cracked players might
  // have their skin cached in sr_player_skins under their name rather than
  // their offline UUID.
  const nameRows = await withDb("default", async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT name FROM fp_player WHERE uuid = ${uuid} LIMIT 1
    `) as { name: string }[];
  });
  const name = nameRows.length > 0 ? nameRows[0].name : null;

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
    
    // Fallback: If no explicit override or if the override query found nothing
    if (!valueRow) {
      if (name) {
        [valueRow] = await db.$queryRaw(Prisma.sql`
          SELECT value FROM sr_player_skins 
          WHERE uuid = ${uuid} OR last_known_name = ${name} 
          ORDER BY timestamp DESC 
          LIMIT 1
        `) as { value: string }[];
      } else {
        [valueRow] = await db.$queryRaw(Prisma.sql`
          SELECT value FROM sr_player_skins WHERE uuid = ${uuid} LIMIT 1
        `) as { value: string }[];
      }
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

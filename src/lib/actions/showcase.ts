"use server";

import { unstable_cache } from "next/cache";
import { withDb } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { resolveSkinUrls } from "@/lib/skin";
import { resolveNameColors } from "@/lib/player-card";

import { siteDb } from "@/lib/site-db";

export const getShowcasePlayers = unstable_cache(
  async () => {
    try {
      const maxIdResult = await withDb(db => db.$queryRaw<{ m: number }[]>(Prisma.sql`SELECT MAX(id) as m FROM fp_player`));
      const maxId = maxIdResult.length > 0 ? Number(maxIdResult[0].m) : 0;
      
      // Generate random IDs to fetch. We generate more than needed because some IDs might be missing/deleted.
      const randomIds = Array.from({ length: 1000 }, () => Math.floor(Math.random() * maxId) + 1);

      const rows = await withDb(async (db) => {
        return await db.$queryRaw(Prisma.sql`
          SELECT uuid, name
          FROM fp_player
          WHERE id IN (${Prisma.join(randomIds)})
          LIMIT 200
        `) as { uuid: string; name: string }[];
      });
      
      const links = rows.length > 0
        ? await siteDb.accountLink.findMany({
            where: { minecraftUuid: { in: rows.map(r => r.uuid) }, status: "CONFIRMED" },
            select: { minecraftUuid: true, user: { select: { nickname: true } } }
          })
        : [];
      
      const linkByUuid = new Map(links.map(l => [l.minecraftUuid, l.user.nickname]));

      const profileRows = [];
      const normalRows = [];
      
      for (const r of rows) {
        if (linkByUuid.has(r.uuid)) profileRows.push(r);
        else normalRows.push(r);
      }

      const TARGET_COUNT = 50;
      const selectedProfile = profileRows.slice(0, TARGET_COUNT);
      
      const finalRows = [...selectedProfile];
      let needed = TARGET_COUNT - finalRows.length;

      const candidatesWithSkin = [];
      const candidatesWithoutSkin = [];

      if (needed > 0) {
        const candidates = normalRows.slice(0, needed * 2);
        const candidateSkins = await resolveSkinUrls(candidates.map(c => c.uuid));

        for (let i = 0; i < candidates.length; i++) {
          if (candidateSkins[i]) candidatesWithSkin.push(candidates[i]);
          else candidatesWithoutSkin.push(candidates[i]);
        }

        const takeSkin = candidatesWithSkin.slice(0, needed);
        finalRows.push(...takeSkin);
        needed -= takeSkin.length;

        if (needed > 0) {
          const takeNoSkin = candidatesWithoutSkin.slice(0, needed);
          finalRows.push(...takeNoSkin);
        }
      }

      // resolveSkinUrl caches per uuid, so re-resolving here for rows
      // already resolved above (the candidates that made it into
      // finalRows) is a cache hit, not a second query. Colors are only
      // resolved here, for the final ~50 selected rows — not the larger
      // candidate pool above, which would look up colors for players who
      // never make it into the showcase at all.
      const [finalSkins, finalColors] = await Promise.all([
        resolveSkinUrls(finalRows.map(r => r.uuid)),
        resolveNameColors(finalRows.map(r => r.uuid)),
      ]);

      const shuffled = finalRows.map((r, i) => ({
        name: r.name,
        skinUrl: finalSkins[i] ?? null,
        profileUsername: linkByUuid.get(r.uuid) ?? null,
        nameColor: finalColors[i] ?? null,
      })).sort(() => 0.5 - Math.random());

      return {
        players: shuffled,
        total: maxId
      };
    } catch (e) {
      console.error("[showcase] Error fetching showcase players:", e);
      return { players: [], total: 0 };
    }
  },
  ["showcase-players"],
  { revalidate: 43200 } // 12 hours (12 * 60 * 60)
);

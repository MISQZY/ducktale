"use server";

import { unstable_cache } from "next/cache";
import { withDb } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { resolveSkinUrls } from "@/lib/skin";

import { siteDb } from "@/lib/site-db";

export const getShowcasePlayers = unstable_cache(
  async () => {
    try {
      const totalResult = await withDb(db => db.$queryRaw<{ c: bigint }[]>(Prisma.sql`SELECT COUNT(*) as c FROM fp_player`));
      const total = totalResult.length > 0 ? Number(totalResult[0].c) : 0;
      
      const half = Math.max(50, Math.floor(total / 2));

      const rows = await withDb(async (db) => {
        return await db.$queryRaw(Prisma.sql`
          SELECT uuid, name
          FROM fp_player
          ORDER BY RAND()
          LIMIT ${half}
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
      // finalRows) is a cache hit, not a second query.
      const finalSkins = await resolveSkinUrls(finalRows.map(r => r.uuid));

      const shuffled = finalRows.map((r, i) => ({
        name: r.name,
        skinUrl: finalSkins[i] ?? null,
        profileUsername: linkByUuid.get(r.uuid) ?? null
      })).sort(() => 0.5 - Math.random());

      return {
        players: shuffled,
        total
      };
    } catch (e) {
      console.error("[showcase] Error fetching showcase players:", e);
      return { players: [], total: 0 };
    }
  },
  ["showcase-players"],
  { revalidate: 43200 } // 12 hours (12 * 60 * 60)
);

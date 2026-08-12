import { withDb } from "@/lib/db";
import { resolveSkinUrl } from "@/lib/skin";
import { EXTERNAL_APIS } from "@/config/external-apis";
import type { QuestNodeDef } from "@/components/quest-tree/types";

/**
 * Fills in `characterSkinUrl` for every node with a `characterName`, using
 * two sources — both are real, no third "embedded" source, just chained
 * instead of picked exclusively by a flag:
 *
 * 1. SkinsRestorer (this server's own database): characterName ->
 *    fp_player.uuid -> resolveSkinUrl(uuid) (src/lib/skin.ts — already
 *    handles PLAYER/CUSTOM/URL skin overrides, the same logic the
 *    leaderboard/player card use). Correct for an NPc skin borrowed from
 *    someone who's actually played here, and reflects their *current*
 *    skin if they change it later.
 * 2. Mojang directly (minotar.net), tried whenever #1 comes up empty —
 *    not everyone whose skin got borrowed for an NPC has ever set foot on
 *    this server (confirmed by hand: some borrowed usernames are real,
 *    live premium accounts per api.mojang.com, just never in fp_player),
 *    and minotar.net resolves those fine on its own.
 *
 * `legacy: true` skips straight to #2 — for hand-authored content (or an
 * NPC override) that's *known* to be a real Mojang account, no point
 * spending a query on a lookup that can't possibly find it locally.
 *
 * A name that resolves through neither leaves characterSkinUrl unset —
 * QuestNodeCard shows no portrait rather than a wrong one.
 *
 * Hardcodes the "default" database key (fp_player lives there, not a
 * server-specific key — see src/lib/players.ts's own default) since quest
 * data is DuckBurg-only for now; revisit if another server's quest lines
 * ever need this.
 */
export async function resolveCharacterSkins(nodes: QuestNodeDef[]): Promise<QuestNodeDef[]> {
  const namesToResolve = [
    ...new Set(nodes.filter((node) => node.characterName).map((node) => node.characterName!)),
  ];
  if (namesToResolve.length === 0) return nodes;

  const skinsRestorerNames = [
    ...new Set(nodes.filter((node) => node.characterName && !node.legacy).map((node) => node.characterName!)),
  ];

  const players = skinsRestorerNames.length > 0
    ? await withDb((db) =>
        db.fp_player.findMany({
          where: { name: { in: skinsRestorerNames } },
          select: { name: true, uuid: true },
        })
      )
    : [];
  const uuidByName = new Map(players.map((p) => [p.name, p.uuid]));

  const urlByName = new Map<string, string>();
  await Promise.all(
    namesToResolve.map(async (name) => {
      const uuid = uuidByName.get(name);
      const skinsRestorerUrl = uuid ? await resolveSkinUrl(uuid) : null;
      const url = skinsRestorerUrl ?? EXTERNAL_APIS.legacy_skin.skinUrl(name);
      urlByName.set(name, url);
    })
  );

  return nodes.map((node) => {
    if (!node.characterName) return node;
    const url = urlByName.get(node.characterName);
    return url ? { ...node, characterSkinUrl: url } : node;
  });
}

import { withDb } from "@/lib/db";
import { resolveSkinUrl } from "@/lib/skin";
import type { QuestNodeDef } from "@/components/quest-tree/types";

/**
 * Fills in `characterSkinUrl` for every node with a `characterName` and no
 * `legacy: true` — i.e. every auto-generated quest-catalog node, since
 * their characterName is a username borrowed for an NPC's skin (see
 * CitizensCollector.java), not necessarily a real premium Mojang account.
 * This server is cracked/offline-mode in practice: NPC skins get borrowed
 * from players who only exist in *this server's own* database, which
 * minotar.net (a Mojang-account lookup) can never resolve — confirmed by
 * hand: `api.mojang.com/users/profiles/minecraft/<name>` 404s for names
 * pulled straight out of Citizens' saves.yml, even though those names do
 * have real skin data attached via SkinsRestorer.
 *
 * Resolution path: characterName -> fp_player.uuid (this server's main
 * FlectonePulse database) -> resolveSkinUrl(uuid) (SkinsRestorer,
 * src/lib/skin.ts — already handles PLAYER/CUSTOM/URL skin overrides, the
 * same logic the leaderboard/player card use). A name resolving to no
 * player, or a player with no skin on record, just leaves
 * characterSkinUrl unset — QuestNodeCard shows no portrait rather than a
 * wrong one.
 *
 * Hardcodes the "default" database key (fp_player lives there, not a
 * server-specific key — see src/lib/players.ts's own default) since quest
 * data is DuckBurg-only for now; revisit if another server's quest lines
 * ever need this.
 */
export async function resolveCharacterSkins(nodes: QuestNodeDef[]): Promise<QuestNodeDef[]> {
  const namesToResolve = [
    ...new Set(
      nodes
        .filter((node) => node.characterName && !node.legacy)
        .map((node) => node.characterName!)
    ),
  ];
  if (namesToResolve.length === 0) return nodes;

  const players = await withDb((db) =>
    db.fp_player.findMany({
      where: { name: { in: namesToResolve } },
      select: { name: true, uuid: true },
    })
  );
  const uuidByName = new Map(players.map((p) => [p.name, p.uuid]));

  const urlByName = new Map<string, string | null>();
  await Promise.all(
    namesToResolve.map(async (name) => {
      const uuid = uuidByName.get(name);
      urlByName.set(name, uuid ? await resolveSkinUrl(uuid) : null);
    })
  );

  return nodes.map((node) => {
    if (!node.characterName || node.legacy) return node;
    const url = urlByName.get(node.characterName);
    return url ? { ...node, characterSkinUrl: url } : node;
  });
}

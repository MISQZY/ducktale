import { siteDb } from "@/lib/site-db";
import { parsePackage } from "./parsePackage";
import { buildQuestNodes } from "./buildQuestNodes";
import { resolveCharacterSkins } from "./resolveCharacterSkins";
import type { NpcIdentityInfo, ParsedPackage } from "./types";
import type { QuestNodeDef } from "@/components/quest-tree/types";

/** A quest_catalog.files value should be a flat string->string map — anything else means a malformed row (or a plugin-side bug), so it's dropped rather than trusted blindly. */
function asFileMap(value: unknown): Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [path, content] of Object.entries(value as Record<string, unknown>)) {
    if (typeof content === "string") result[path] = content;
  }
  return result;
}

/**
 * Reads quest_catalog rows (optionally scoped to one server and/or one
 * package — a "quest line" page only ever wants its own package, since
 * buildQuestNodes only resolves prerequisites *within* the packages it's
 * given) and turns them into QuestNodeDef[], ready to pass to
 * <QuestTree nodes={...} />. See buildQuestNodes.ts for what "turns into"
 * actually means — this is a heuristic derived from BetonQuest's raw
 * package files, not per-player live state (see BETONQUEST_QUEST_TREE.md).
 * A final pass (resolveCharacterSkins) fills in each node's actual skin
 * texture through this server's SkinsRestorer database.
 */
export async function getQuestTreeNodes(server?: string, packageName?: string): Promise<QuestNodeDef[]> {
  const [rows, npcRows] = await Promise.all([
    siteDb.questCatalog.findMany({
      where: {
        ...(server ? { server } : {}),
        ...(packageName ? { packageName } : {}),
      },
      orderBy: [{ server: "asc" }, { packageName: "asc" }],
    }),
    siteDb.npcIdentity.findMany({
      where: server ? { server } : undefined,
    }),
  ]);

  const packages: ParsedPackage[] = rows.map((row) =>
    parsePackage(row.server, row.packageName, asFileMap(row.files))
  );

  // Keyed "<server>:<npcId>" — the same Citizens npc id means different
  // NPCs on different servers, so server has to be part of the key.
  const npcIdentities = new Map<string, NpcIdentityInfo>(
    npcRows.map((row) => [`${row.server}:${row.npcId}`, { name: row.name, skinSourceName: row.skinSourceName }])
  );

  const nodes = buildQuestNodes(packages, npcIdentities);
  return resolveCharacterSkins(nodes);
}

/** Distinct server names with at least one synced package — for a page that lets an admin/visitor pick which server's quest lines to view. */
export async function listQuestCatalogServers(): Promise<string[]> {
  const rows = await siteDb.questCatalog.findMany({
    select: { server: true },
    distinct: ["server"],
    orderBy: { server: "asc" },
  });
  return rows.map((row) => row.server);
}

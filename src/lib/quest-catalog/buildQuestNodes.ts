import { stripMinecraftColors } from "./instruction";
import type { ParsedPackage } from "./types";
import type { QuestNodeDef } from "@/components/quest-tree/types";

const COLUMN_WIDTH = 420;
const ROW_HEIGHT = 260;

interface Candidate {
  id: string;
  server: string;
  packageName: string;
  objectiveKey: string;
  title: string;
  description: string;
  /** Tag names (not condition/action keys) this node needs before it can start. */
  requiredTags: Set<string>;
  /** Tag names this node's completion sets — what other nodes' requiredTags get matched against. */
  producedTags: Set<string>;
}

/** "pathToGoldenburg" -> "Path To Goldenburg" — BetonQuest objectives have no human title field, this is the best available fallback. */
function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** Resolves a condition key to the tag name it actually tests, if it's a tag condition — otherwise undefined (can't be turned into a prerequisite edge). */
function tagNameOfCondition(pkg: ParsedPackage, conditionKey: string): string | undefined {
  const condition = pkg.conditions[conditionKey];
  if (!condition || condition.type !== "tag") return undefined;
  return condition.raw.trim().split(/\s+/)[1];
}

function buildCandidate(pkg: ParsedPackage, objectiveKey: string): Candidate {
  const objective = pkg.objectives[objectiveKey];
  const id = `${pkg.server}:${pkg.packageName}.${objectiveKey}`;

  const requiredTags = new Set<string>();
  for (const conditionKey of objective.entryConditions) {
    const tag = tagNameOfCondition(pkg, conditionKey);
    if (tag) requiredTags.add(tag);
  }

  // Find the conversation option that actually starts this objective
  // (an NPC_options entry whose actions include an "objective start
  // <objectiveKey>" action) — its text becomes the node's description,
  // and its own conditions are additional (dialogue-gate) prerequisites,
  // since a player can't trigger the objective without first satisfying
  // whatever unlocks that dialogue option.
  let description = "";
  for (const conversation of Object.values(pkg.conversations)) {
    for (const option of Object.values(conversation.npcOptions)) {
      const startsThis = option.actions.some((actionKey) => pkg.actions[actionKey]?.startsObjective === objectiveKey);
      if (!startsThis) continue;

      description = stripMinecraftColors(option.text).trim();
      for (const conditionKey of option.conditions) {
        const tag = tagNameOfCondition(pkg, conditionKey);
        if (tag) requiredTags.add(tag);
      }
    }
  }

  const producedTags = new Set<string>();
  for (const actionKey of objective.completionActions) {
    const action = pkg.actions[actionKey];
    if (action?.type === "tag" && (action.tagOp === "add" || action.tagOp === undefined) && action.tagName) {
      producedTags.add(action.tagName);
    }
  }

  return {
    id,
    server: pkg.server,
    packageName: pkg.packageName,
    objectiveKey,
    title: humanize(objectiveKey),
    description,
    requiredTags,
    producedTags,
  };
}

/**
 * Turns every package's raw BetonQuest data into a flat QuestNodeDef[] —
 * one node per objective. This is a heuristic, not a faithful
 * reimplementation of BetonQuest's own logic:
 *
 * - Prerequisites are derived by matching a node's required tags (from its
 *   objective's "entry conditions:" plus the conversation option that
 *   starts it) against which *other* node produces that tag on completion
 *   (its own "actions:"/"events:" setting a tag). A required tag with no
 *   producing objective among these packages just doesn't produce an edge
 *   — it's either an entry point, or gated by something outside this
 *   model (a raw dialogue choice with no objective behind it, a
 *   cross-package tag, a condition type other than "tag").
 * - `status` has no per-player data behind it (see BETONQUEST_QUEST_TREE.md
 *   — this plugin pipeline intentionally doesn't track progress): nodes
 *   with no resolved prerequisites are "active", everything else is
 *   "locked". This is a static placeholder, not a real per-player state.
 * - `x`/`y` are auto-laid-out by prerequisite depth (topological layers),
 *   not hand-placed — expect a mechanical-looking grid, not a curated
 *   layout.
 * - `objectives`/`rewards` are left empty: BetonQuest doesn't expose a
 *   numeric target amount or a "reward" concept generically enough to
 *   populate these without guessing.
 */
export function buildQuestNodes(packages: ParsedPackage[]): QuestNodeDef[] {
  const candidates: Candidate[] = [];
  for (const pkg of packages) {
    for (const objectiveKey of Object.keys(pkg.objectives)) {
      candidates.push(buildCandidate(pkg, objectiveKey));
    }
  }

  const producersByTag = new Map<string, string[]>();
  for (const candidate of candidates) {
    for (const tag of candidate.producedTags) {
      const producers = producersByTag.get(tag) ?? [];
      producers.push(candidate.id);
      producersByTag.set(tag, producers);
    }
  }

  const prerequisitesById = new Map<string, string[]>();
  for (const candidate of candidates) {
    const prereqs = new Set<string>();
    for (const tag of candidate.requiredTags) {
      for (const producerId of producersByTag.get(tag) ?? []) {
        if (producerId !== candidate.id) prereqs.add(producerId);
      }
    }
    prerequisitesById.set(candidate.id, [...prereqs]);
  }

  const depthById = resolveDepths(candidates.map((c) => c.id), prerequisitesById);
  const columnCounts = new Map<number, number>();

  return candidates.map((candidate) => {
    const depth = depthById.get(candidate.id) ?? 0;
    const rowIndex = columnCounts.get(depth) ?? 0;
    columnCounts.set(depth, rowIndex + 1);

    const prerequisites = prerequisitesById.get(candidate.id) ?? [];

    const node: QuestNodeDef = {
      id: candidate.id,
      title: candidate.title,
      description: candidate.description || `Пакет ${candidate.packageName} · ${candidate.server}`,
      status: prerequisites.length > 0 ? "locked" : "active",
      prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
      x: depth * COLUMN_WIDTH,
      y: rowIndex * ROW_HEIGHT,
    };
    return node;
  });
}

/** BFS-style layering: a node's depth is one more than its deepest prerequisite. Cycle-safe (BetonQuest data isn't guaranteed acyclic) — a node stuck in a cycle just settles at whatever depth it reached before the iteration cap. */
function resolveDepths(ids: string[], prerequisitesById: Map<string, string[]>): Map<string, number> {
  const depth = new Map<string, number>(ids.map((id) => [id, 0]));
  const maxIterations = ids.length + 1;

  for (let i = 0; i < maxIterations; i++) {
    let changed = false;
    for (const id of ids) {
      const prereqs = prerequisitesById.get(id) ?? [];
      const wanted = prereqs.reduce((max, prereqId) => Math.max(max, (depth.get(prereqId) ?? 0) + 1), 0);
      if (wanted > (depth.get(id) ?? 0)) {
        depth.set(id, wanted);
        changed = true;
      }
    }
    if (!changed) break;
  }

  return depth;
}

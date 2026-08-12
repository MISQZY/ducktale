import { stripMinecraftColors } from "./instruction";
import type { NpcIdentityInfo, ParsedPackage } from "./types";
import type { QuestNodeDef } from "@/components/quest-tree/types";

const COLUMN_WIDTH = 420;
const ROW_HEIGHT = 260;
const TITLE_MAX_LENGTH = 60;

interface Candidate {
  id: string;
  server: string;
  packageName: string;
  objectiveKey: string;
  title: string;
  /** Full dialogue line that triggers this objective, quote-formatted for QuestNodeCard's objectives[] — empty when no triggering conversation option was found. */
  quote: string;
  /** Minecraft username the questgiving NPC's skin was borrowed from (NpcIdentity.skinSourceName) — resolved to an actual image server-side by resolveCharacterSkins.ts, never shown as text. */
  characterName?: string;
  /** The NPC's real name (NpcIdentity.name) — shown as text under the title, in place of characterName. */
  npcName?: string;
  /** Tag names (not condition/action keys) this node needs before it can start. */
  requiredTags: Set<string>;
  /** Tag names this node's completion sets — what other nodes' requiredTags get matched against. */
  producedTags: Set<string>;
}

/** "pathToGoldenburg" -> "Path To Goldenburg" — BetonQuest objective/NPC keys have no human title field, this is the best available fallback when there's no dialogue text to source one from. */
function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** Extracts the numeric id out of a package.yml "npcs:" value like "citizens 0" — undefined for anything else (a non-Citizens NPC provider, or a malformed value). */
function parseCitizensId(raw: string | undefined): number | undefined {
  const match = raw ? /citizens\s+(\d+)/.exec(raw) : null;
  return match ? Number(match[1]) : undefined;
}

/** Resolves a package.yml "npcs:" key (e.g. "goldenburgMayor") to that NPC's real identity, via its Citizens id — undefined if the key doesn't exist, isn't a Citizens NPC, or BetonQuestApi never reported that id for this server (Citizens not installed/configured, or a stale/pending sync). */
function resolveNpcByKey(pkg: ParsedPackage, npcKey: string, npcIdentities: Map<string, NpcIdentityInfo>): NpcIdentityInfo | undefined {
  const citizensId = parseCitizensId(pkg.npcs[npcKey]);
  if (citizensId === undefined) return undefined;
  return npcIdentities.get(`${pkg.server}:${citizensId}`);
}

/**
 * Substitutes %npc.<key>.name% with that NPC's real name (NpcIdentity,
 * sourced from Citizens' saves.yml — see CitizensCollector.java) when
 * known; falls back to the humanized key when this pipeline has no
 * identity for it yet (Citizens not installed, or synced after this
 * package was). Any other placeholder pattern is left as-is — better an
 * unresolved %placeholder% than a wrong guess.
 */
function resolveKnownPlaceholders(text: string, pkg: ParsedPackage, npcIdentities: Map<string, NpcIdentityInfo>): string {
  return text.replace(/%npc\.([a-zA-Z0-9_]+)\.name%/g, (_match, npcKey: string) => {
    return resolveNpcByKey(pkg, npcKey, npcIdentities)?.name ?? humanize(npcKey);
  });
}

/** The npc.yml key a conversation's "quester:" placeholder refers to, e.g. "%npc.instructor.name%" -> "instructor" — undefined if quester isn't in that exact placeholder form. */
function extractNpcKeyFromQuester(quester: string | undefined): string | undefined {
  return quester ? /%npc\.([a-zA-Z0-9_]+)\.name%/.exec(quester)?.[1] : undefined;
}

/** Cuts at the last full word before maxLength rather than mid-word, appending "…". */
function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/** A short title sourced from the actual (Russian) dialogue line, not the English objective key — falls back to humanize(fallbackKey) only when no dialogue text exists at all. */
function deriveTitle(dialogueText: string, fallbackKey: string): string {
  const firstSentence = dialogueText.split(/(?<=[.!?])\s+/)[0]?.trim();
  if (!firstSentence) return humanize(fallbackKey);
  return truncateAtWord(firstSentence, TITLE_MAX_LENGTH);
}

/** Resolves a condition key to the tag name it actually tests, if it's a tag condition — otherwise undefined (can't be turned into a prerequisite edge). */
function tagNameOfCondition(pkg: ParsedPackage, conditionKey: string): string | undefined {
  const condition = pkg.conditions[conditionKey];
  if (!condition || condition.type !== "tag") return undefined;
  return condition.raw.trim().split(/\s+/)[1];
}

function buildCandidate(pkg: ParsedPackage, objectiveKey: string, npcIdentities: Map<string, NpcIdentityInfo>): Candidate {
  const objective = pkg.objectives[objectiveKey];
  const id = `${pkg.server}:${pkg.packageName}.${objectiveKey}`;

  const requiredTags = new Set<string>();
  for (const conditionKey of objective.entryConditions) {
    const tag = tagNameOfCondition(pkg, conditionKey);
    if (tag) requiredTags.add(tag);
  }

  // Find the conversation option that actually starts this objective
  // (an NPC_options entry whose actions include an "objective start
  // <objectiveKey>" action) — its text becomes the node's quote and
  // titles are sourced from it too, and its own conditions are additional
  // (dialogue-gate) prerequisites, since a player can't trigger the
  // objective without first satisfying whatever unlocks that option. The
  // conversation's own "quester:" placeholder identifies which NPC is
  // speaking, which is how characterName gets resolved.
  let quote = "";
  let characterName: string | undefined;
  let npcName: string | undefined;
  for (const conversation of Object.values(pkg.conversations)) {
    for (const option of Object.values(conversation.npcOptions)) {
      const startsThis = option.actions.some((actionKey) => pkg.actions[actionKey]?.startsObjective === objectiveKey);
      if (!startsThis) continue;

      quote = resolveKnownPlaceholders(stripMinecraftColors(option.text).replace(/\s+/g, " ").trim(), pkg, npcIdentities);
      for (const conditionKey of option.conditions) {
        const tag = tagNameOfCondition(pkg, conditionKey);
        if (tag) requiredTags.add(tag);
      }

      const questerNpcKey = extractNpcKeyFromQuester(conversation.quester);
      const identity = questerNpcKey ? resolveNpcByKey(pkg, questerNpcKey, npcIdentities) : undefined;
      characterName = identity?.skinSourceName ?? undefined;
      npcName = identity?.name;
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
    title: deriveTitle(quote, objectiveKey),
    quote,
    characterName,
    npcName,
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
 * - `objectives` gets exactly one entry: the triggering dialogue line,
 *   `quote: true` (renders as an italicized quote in QuestNodeCard, not a
 *   checklist item — see that component). No numeric current/total:
 *   BetonQuest doesn't expose a target amount generically enough to
 *   populate one without guessing.
 * - `rewards` is left empty — same reasoning, no generic "reward" concept
 *   to extract from raw actions without guessing.
 * - `%npc.<key>.name%` placeholders resolve to the NPC's real name when
 *   `npcIdentities` has one (see resolveKnownPlaceholders/CitizensCollector.java),
 *   falling back to the humanized key otherwise. `characterName` (feeds
 *   SkinFace's portrait + QuestNodeCard's mono nick label) only ever comes
 *   from a resolved identity — never a guess — so it's simply absent when
 *   there isn't one.
 */
export function buildQuestNodes(packages: ParsedPackage[], npcIdentities: Map<string, NpcIdentityInfo> = new Map()): QuestNodeDef[] {
  const candidates: Candidate[] = [];
  for (const pkg of packages) {
    for (const objectiveKey of Object.keys(pkg.objectives)) {
      candidates.push(buildCandidate(pkg, objectiveKey, npcIdentities));
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
      description: candidate.quote ? "" : `Пакет ${candidate.packageName} · ${candidate.server}`,
      status: prerequisites.length > 0 ? "locked" : "active",
      characterName: candidate.characterName,
      npcName: candidate.npcName,
      objectives: candidate.quote
        ? [{ id: `${candidate.id}.quote`, label: candidate.quote, quote: true }]
        : undefined,
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

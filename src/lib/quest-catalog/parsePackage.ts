import { load as loadYaml } from "js-yaml";
import { extractKeyedParam, instructionType, splitRefs } from "./instruction";
import type {
  ParsedAction,
  ParsedCondition,
  ParsedConversation,
  ParsedConversationOption,
  ParsedObjective,
  ParsedPackage,
} from "./types";

/** Narrows js-yaml's `unknown` load result down to a plain object, or {} for anything else (missing file, empty file, a bare scalar/list). */
function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** Only string-valued entries survive — a malformed/non-string instruction is dropped rather than crashing the whole package parse over one bad line. */
function stringEntries(value: unknown): [string, string][] {
  return Object.entries(asRecord(value)).filter((entry): entry is [string, string] => typeof entry[1] === "string");
}

function parseConditions(raw: string | undefined): Record<string, ParsedCondition> {
  if (!raw) return {};
  const doc = asRecord(loadYaml(raw));
  const result: Record<string, ParsedCondition> = {};
  for (const [key, instruction] of stringEntries(doc.conditions)) {
    result[key] = { key, raw: instruction, type: instructionType(instruction) };
  }
  return result;
}

function parseObjectives(raw: string | undefined): Record<string, ParsedObjective> {
  if (!raw) return {};
  const doc = asRecord(loadYaml(raw));
  const result: Record<string, ParsedObjective> = {};
  for (const [key, instruction] of stringEntries(doc.objectives)) {
    const entryConditionsRaw = extractKeyedParam(instruction, "entry conditions") ?? extractKeyedParam(instruction, "conditions");
    const completionActionsRaw = extractKeyedParam(instruction, "actions") ?? extractKeyedParam(instruction, "events");
    const type = instructionType(instruction);
    result[key] = {
      key,
      raw: instruction,
      type,
      entryConditions: splitRefs(entryConditionsRaw)
        .filter((ref) => !ref.negated)
        .map((ref) => ref.key),
      completionActions: splitRefs(completionActionsRaw).map((ref) => ref.key),
      watchedTag: type === "tag" ? instruction.trim().split(/\s+/)[1] : undefined,
    };
  }
  return result;
}

function parseActions(raw: string | undefined): Record<string, ParsedAction> {
  if (!raw) return {};
  const doc = asRecord(loadYaml(raw));
  // "actions" is the 3.x key; some packages migrated from 2.x may still say "events".
  const result: Record<string, ParsedAction> = {};
  for (const [key, instruction] of stringEntries(doc.actions ?? doc.events)) {
    const type = instructionType(instruction);
    const parsed: ParsedAction = { key, raw: instruction, type };

    const tokens = instruction.trim().split(/\s+/);
    if (type === "tag") {
      const [op, name] = tokens.slice(1);
      if (op === "add" || op === "remove" || op === "delete") {
        parsed.tagOp = op;
        parsed.tagName = name;
      } else {
        // "tag <name>" with no explicit op defaults to add per BetonQuest's own docs.
        parsed.tagOp = "add";
        parsed.tagName = op;
      }
    } else if (type === "objective" && tokens[1] === "start") {
      parsed.startsObjective = tokens[2];
    }

    result[key] = parsed;
  }
  return result;
}

function parseOptions(raw: unknown): Record<string, ParsedConversationOption> {
  const result: Record<string, ParsedConversationOption> = {};
  for (const [key, value] of Object.entries(asRecord(raw))) {
    const option = asRecord(value);
    const text = option.text;
    result[key] = {
      key,
      text: typeof text === "string" ? text : Array.isArray(text) ? text.join(" ") : "",
      pointers: splitRefs(typeof option.pointers === "string" ? option.pointers : undefined).map((r) => r.key),
      conditions: splitRefs(typeof option.conditions === "string" ? option.conditions : undefined)
        .filter((r) => !r.negated)
        .map((r) => r.key),
      actions: splitRefs(typeof option.actions === "string" ? option.actions : undefined).map((r) => r.key),
    };
  }
  return result;
}

function parseConversations(files: Record<string, string>): Record<string, ParsedConversation> {
  const result: Record<string, ParsedConversation> = {};
  for (const [path, content] of Object.entries(files)) {
    if (!path.startsWith("conversations/")) continue;
    const doc = asRecord(loadYaml(content));
    for (const [key, value] of Object.entries(asRecord(doc.conversations))) {
      const conv = asRecord(value);
      result[key] = {
        key,
        quester: typeof conv.quester === "string" ? conv.quester : undefined,
        first: splitRefs(typeof conv.first === "string" ? conv.first : undefined).map((r) => r.key),
        npcOptions: parseOptions(conv.NPC_options),
        playerOptions: parseOptions(conv.player_options),
      };
    }
  }
  return result;
}

/**
 * Turns one quest_catalog row's raw `files` map into structured data.
 * Never throws on malformed YAML/instructions in one file — a broken
 * conditions.yml shouldn't take down parsing for every other package.
 */
export function parsePackage(server: string, packageName: string, files: Record<string, string>): ParsedPackage {
  let npcs: Record<string, string> = {};
  try {
    const packageDoc = asRecord(files["package.yml"] ? loadYaml(files["package.yml"]) : undefined);
    npcs = Object.fromEntries(stringEntries(packageDoc.npcs));
  } catch {
    // package.yml is optional context (NPC names) — safe to continue without it.
  }

  const safeParse = <T>(fn: () => T, fallback: T, what: string): T => {
    try {
      return fn();
    } catch (error) {
      console.warn(`[quest-catalog] failed to parse ${server}/${packageName}/${what}:`, error);
      return fallback;
    }
  };

  return {
    server,
    packageName,
    npcs,
    conditions: safeParse(() => parseConditions(files["conditions.yml"]), {}, "conditions.yml"),
    objectives: safeParse(() => parseObjectives(files["objectives.yml"]), {}, "objectives.yml"),
    actions: safeParse(() => parseActions(files["actions.yml"]), {}, "actions.yml"),
    conversations: safeParse(() => parseConversations(files), {}, "conversations/*"),
  };
}

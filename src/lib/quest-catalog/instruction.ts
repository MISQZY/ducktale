/**
 * BetonQuest instructions are a small space-separated mini-language
 * ("location -1221;78;209;world 25 entry conditions:!tagName
 * actions:key1,key2"), and its full grammar (quoting, per-type argument
 * shapes) is genuinely BetonQuest's own `Instruction` parser's job, not
 * something worth reimplementing generally here. These helpers only
 * extract the handful of things buildQuestNodes.ts actually needs: the
 * instruction's type (first token) and specific `key:value` parameters
 * where the value is comma-separated references to other
 * conditions/actions/objectives.
 */

/** The instruction's type — the first whitespace-separated token, e.g. "tag", "location", "objective". */
export function instructionType(raw: string): string {
  return raw.trim().split(/\s+/, 1)[0] ?? "";
}

/**
 * Extracts a `key:value` parameter's value, where value is a single
 * whitespace-free token — BetonQuest's own convention for keyed optional
 * arguments. `key` may itself contain a space ("entry conditions", not
 * just "conditions").
 */
export function extractKeyedParam(raw: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|\\s)${escaped}:(\\S+)`).exec(raw);
  return match?.[1];
}

export interface Ref {
  key: string;
  negated: boolean;
}

/** Splits a comma-separated list of condition/action/objective references, stripping "!" negation prefixes. */
export function splitRefs(value: string | undefined | null): Ref[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => (v.startsWith("!") ? { key: v.slice(1), negated: true } : { key: v, negated: false }));
}

/** Strips Minecraft "&x" color/format codes for plain-text display — QuestNodeCard renders description as plain text, not rich text. */
export function stripMinecraftColors(text: string): string {
  return text.replace(/&[0-9a-fk-orA-FK-OR]/g, "");
}

/** One BetonQuest condition, as defined in conditions.yml. */
export interface ParsedCondition {
  key: string;
  raw: string;
  /** First token of the instruction, e.g. "tag", "point", "permission". */
  type: string;
}

/**
 * One BetonQuest objective, as defined in objectives.yml. entryConditions
 * are what must be true for the objective to even start (the "entry
 * conditions:" param) — negated ones are excluded from graph-building
 * (see buildQuestNodes.ts) since "must NOT have X" doesn't map onto
 * QuestNodeDef's prerequisites/optionalPrerequisites, both of which mean
 * "must have X". completionActions are what fires once the objective is
 * done (the "actions:"/"events:" param) — this is where an objective
 * typically sets a tag that gates the next one.
 */
export interface ParsedObjective {
  key: string;
  raw: string;
  type: string;
  entryConditions: string[];
  completionActions: string[];
}

/** One BetonQuest action ("events" in 2.x terminology), as defined in actions.yml. */
export interface ParsedAction {
  key: string;
  raw: string;
  type: string;
  /** Only set when type === "tag". */
  tagOp?: "add" | "remove" | "delete";
  tagName?: string;
  /** Only set when type === "objective" and the sub-command is "start". */
  startsObjective?: string;
}

/** One dialogue option — NPC_options or player_options entry inside a conversation. */
export interface ParsedConversationOption {
  key: string;
  text: string;
  pointers: string[];
  /** Non-negated condition keys required to see/pick this option. */
  conditions: string[];
  /** Action keys fired when this option is chosen (NPC_options) or reached. */
  actions: string[];
}

/** One BetonQuest conversation (one file under conversations/). */
export interface ParsedConversation {
  key: string;
  quester?: string;
  first: string[];
  npcOptions: Record<string, ParsedConversationOption>;
  playerOptions: Record<string, ParsedConversationOption>;
}

/** Everything parsed out of one QuestCatalog row (one BetonQuest package on one server). */
export interface ParsedPackage {
  server: string;
  packageName: string;
  /** npc key -> raw "citizens N" value from package.yml — no skin/display-name info available from this alone. */
  npcs: Record<string, string>;
  conditions: Record<string, ParsedCondition>;
  objectives: Record<string, ParsedObjective>;
  actions: Record<string, ParsedAction>;
  conversations: Record<string, ParsedConversation>;
}

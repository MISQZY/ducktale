export type QuestStatus = "locked" | "active" | "completed";

export interface QuestObjective {
  id: string;
  label: string;
  /** If provided, renders a progress bar (e.g., 5/10) */
  current?: number;
  total?: number;
  /** Whether this specific objective is completed */
  completed?: boolean;
}

export interface QuestReward {
  id: string;
  label: string;
  // Optional icon identifier or URL
  icon?: string; 
}

export interface QuestNodeDef {
  /** Unique identifier, e.g., "betonquest_package:quest_name" */
  id: string;
  /** Minecraft nickname for SkinFace, typically the NPC starting the quest */
  characterName?: string;
  title: string;
  description: string;
  
  /** Current state of the quest */
  status: QuestStatus;
  
  /** BetonQuest Objectives mapped to UI */
  objectives?: QuestObjective[];
  
  /** BetonQuest Events (Rewards) mapped to UI */
  rewards?: QuestReward[];

  /** IDs of other quests that are strictly required to be completed before this one unlocks */
  prerequisites?: string[];

  /** IDs of quests that are optional. Will draw a dashed line from them to this quest. */
  optionalPrerequisites?: string[];

  /** Visual positioning */
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface QuestTreeProps {
  id: string; // Unique ID for the quest line
  title?: string;
  nodes: QuestNodeDef[];
  frameHeight?: number | string;
  /** If true, enables local storage mocking for completion states (useful before API is ready) */
  mockLocalStorage?: boolean;
}

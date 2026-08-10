import type { ResidentRole } from "@/types/towny";

export type Gender = "male" | "female" | null;

export type GrowthStatus =
  | { state: "unknown" }                        // not tracked by the growth system
  | { state: "growing"; secondsRemaining: number }
  | { state: "complete" };

export interface PlayerCard {
  username:     string;
  nickname:     string;         // FlectonePulse nickname, falls back to "Путник"
  skinUrl:      string | null;  // Mojang texture URL resolved from SkinRestorer, if any
  playtimeMs:   number;         // fp_time.total
  online:       boolean;        // fp_player.online
  lastSeenMs:   number;         // fp_time.last — unix ms of last login/logout
  gender:       Gender;
  growth:       GrowthStatus;
  city:         string | null;  // Towny town name, null if not a resident of any town
  nation:       string | null;  // Towny nation name, null if no nation ("Independent")
  role:         ResidentRole;   // resident's role within `city`, null if not a resident/plain resident
  whitelisted:  boolean;        // Flectone (fp_moderation type=whitelist) status
}

export interface PlayerCardResponse {
  player: PlayerCard | null;    // null when not found / not whitelisted
}

export interface PlayerSuggestion {
  name:     string;
  nickname: string | null;
}

export interface PlayerSearchResponse {
  results: PlayerSuggestion[];
}

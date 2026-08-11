import type { ResidentRole } from "@/types/towny";

export type Gender = "male" | "female" | null;

export type GrowthStatus =
  | { state: "unknown" }                        // not tracked by the growth system
  | { state: "growing"; secondsRemaining: number }
  | { state: "complete" };

/** Per-server breakdown — whitelist status is genuinely per-server (fp_moderation.server); city/nation/role are Towny data, which currently only exists for DuckBurg. */
export interface PlayerServerStatus {
  serverId:    string;
  whitelisted: boolean;
  /** True only on the one server they're actually connected to right now — not the same as the account-wide `online` flag. */
  online:      boolean;
  city:        string | null;
  nation:      string | null;
  role:        ResidentRole;
}

export interface PlayerCard {
  username:     string;
  nickname:     string;         // FlectonePulse nickname, falls back to "Путник"
  skinUrl:      string | null;  // Mojang texture URL resolved from SkinRestorer, if any
  playtimeMs:   number;         // fp_time.total — network-wide, not per-server (FlectonePulse tracks one playtime total across the whole network)
  online:       boolean;        // fp_player.online
  lastSeenMs:   number;         // fp_time.last — unix ms of last login/logout
  gender:       Gender;
  growth:       GrowthStatus;
  city:         string | null;  // Towny town name, null if not a resident of any town
  nation:       string | null;  // Towny nation name, null if no nation ("Independent")
  role:         ResidentRole;   // resident's role within `city`, null if not a resident/plain resident
  whitelisted:  boolean;        // Flectone (fp_moderation type=whitelist) status on DuckBurg specifically — kept for the existing docs player-card search UI
  servers:      PlayerServerStatus[];
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

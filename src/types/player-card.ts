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
  gender:       Gender;
  growth:       GrowthStatus;
  city:         string | null;  // Towny town name, null if not a resident of any town
  nation:       string | null;  // Towny nation name, null if no nation ("Independent")
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

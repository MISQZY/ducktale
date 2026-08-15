import type { ResidentRole } from "@/types/towny";
import type { PlayerTrackRole } from "@/lib/luckperms";

export type Gender = "male" | "female" | null;

/** A player's custom nickname color (FlectonePulse chat-color plugin), parsed from its raw MiniMessage tag — see parseFColor() in src/lib/player-card.ts. */
export type PlayerColor =
  | { type: "solid"; color: string }
  | { type: "gradient"; stops: string[] };

export type GrowthStatus =
  | { state: "unknown" }                        // not tracked by the growth system
  | { state: "growing"; secondsRemaining: number; percent: number; heightMeters: number | null }
  | { state: "complete"; heightMeters: number | null };

/** Per-server breakdown — whitelist status is genuinely per-server (fp_moderation.server); city/nation/role are Towny data, which currently only exists for DuckBurg. */
export interface PlayerServerStatus {
  serverId:    string;
  whitelisted: boolean;
  whitelistEnabled: boolean;
  maintenanceEnabled: boolean;
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
  rank:         number | null;  // 1-based position on the network-wide playtime leaderboard, null unless they're in the top 10
  online:       boolean;        // fp_player.online
  lastSeenMs:   number;         // fp_time.last — unix ms of last login/logout
  gender:       Gender;
  growth:       GrowthStatus;
  city:         string | null;  // Towny town name, null if not a resident of any town
  nation:       string | null;  // Towny nation name, null if no nation ("Independent")
  role:         ResidentRole;   // resident's role within `city`, null if not a resident/plain resident
  whitelisted:  boolean;        // Flectone (fp_moderation type=whitelist) status on DuckBurg specifically — kept for the existing docs player-card search UI
  servers:      PlayerServerStatus[];
  roles:        PlayerTrackRole[]; // LuckPerms roles, one per admin-configured track — see resolvePlayerTrackRoles
  siteOnline:   boolean;        // currently browsing the site — see src/lib/presence.ts. Always false when there's no linked/confirmed site account.
  siteLastSeenMs: number | null; // last known site activity, null if never linked or never seen
  nameColor:    PlayerColor | null; // custom chat-color plugin gradient/solid color, null if the player never set one
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

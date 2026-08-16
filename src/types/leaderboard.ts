import type { LocalizedName } from "@/lib/i18n-name";

export interface LeaderboardPlayerBadge {
  name: LocalizedName;
  icon: string;
  color: string | null;
  description: string | null;
  earnCondition: string | null;
}

export interface LeaderboardPlayer {
  uuid:       string;
  name:       string;
  nickname:   string | null;
  playtimeMs: number;
  online:     boolean;
  /** 1-based position on the *full* leaderboard — unaffected by an active search filter. */
  rank:       number;
  /** Site username to link to (/profile/<username>) — set only when this Minecraft account has a CONFIRMED site AccountLink, null otherwise. */
  profileUsername: string | null;
  /** The single badge to show next to this player's name — their pinned badge if set, otherwise whichever they earned first. Empty when not linked or no badges. */
  badges: LeaderboardPlayerBadge[];
  /** Actual skin URL resolved from SkinRestorer. */
  skinUrl: string | null;
  /** Currently browsing the site (see src/lib/presence.ts) — always false when not linked. */
  siteOnline: boolean;
  /** Last known site activity, unix ms — null when never linked/seen. */
  siteLastSeenMs: number | null;
}

export interface LeaderboardResponse {
  players:    LeaderboardPlayer[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

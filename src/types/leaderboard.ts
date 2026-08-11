export interface LeaderboardPlayerBadge {
  name: string;
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
  /** Same site-account badges shown on their profile — empty when not linked. */
  badges: LeaderboardPlayerBadge[];
}

export interface LeaderboardResponse {
  players:    LeaderboardPlayer[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

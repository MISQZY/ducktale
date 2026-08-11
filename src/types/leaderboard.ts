export interface LeaderboardPlayer {
  uuid:       string;
  name:       string;
  nickname:   string | null;
  playtimeMs: number;
  online:     boolean;
  /** Site username to link to (/profile/<username>) — set only when this Minecraft account has a CONFIRMED site AccountLink, null otherwise. */
  profileUsername: string | null;
}

export interface LeaderboardResponse {
  players:    LeaderboardPlayer[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

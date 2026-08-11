export interface LeaderboardPlayer {
  uuid:       string;
  name:       string;
  nickname:   string | null;
  playtimeMs: number;
  online:     boolean;
}

export interface LeaderboardResponse {
  players:    LeaderboardPlayer[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

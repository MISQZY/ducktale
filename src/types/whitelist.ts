export interface WhitelistPlayer {
  id:        number;
  name:      string;
  uuid:      string;
  addedAt:   number;
  expiresAt: number; // 0 = permanent
  moderator: string;
  reason:    string | null;
  server:    string | null;
}

export interface WhitelistResponse {
  players:    WhitelistPlayer[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

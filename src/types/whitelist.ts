export interface WhitelistPlayer {
  id:        number;
  name:      string;
  uuid:      string;
  addedAt:   number;
  expiresAt: number; // 0 = permanent
  moderator: string;
}

export interface WhitelistResponse {
  players:    WhitelistPlayer[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

import type { TownBase } from "@/types/towny";

export interface RankedTown extends TownBase {
  /** 1-based position on the *full* ranking — unaffected by an active search filter. */
  rank: number;
}

export interface TownRankingResponse {
  towns:      RankedTown[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

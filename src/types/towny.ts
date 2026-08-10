export type ResidentRole = "mayor" | "deputy" | null;

export interface Resident {
  display: string;     // "nickname (username)"
  role:    ResidentRole;
}

export interface Town {
  name:       string;
  tag:        string | null; // raw Towny tag, e.g. "&6ЗЛТ" — used to derive the town's color
  nation:     string | null; // null = no nation ("Independent")
  nationTag:  string | null; // raw Towny nation tag — used to derive the nation badge's color
  size:       number;        // number of claimed town blocks
  residents:  Resident[];    // sorted: mayor, then deputy, then everyone else
}

export interface TownyResponse {
  towns:      Town[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

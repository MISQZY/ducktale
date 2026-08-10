import type { ResidentRole } from "@/types/towny";

export const DEPUTY_RANK = "vice";

/** Canonical role text color, shared by the towns table's resident badges and the player card's position line. */
export const RESIDENT_ROLE_COLOR: Record<Exclude<ResidentRole, null>, string> = {
  mayor:  "text-gold-700 dark:text-gold-300 font-semibold",
  deputy: "text-slate-700 dark:text-slate-300 font-semibold",
};

/** Derives a resident's town role from TOWNY_TOWNS.mayor and TOWNY_RESIDENTS.`town-ranks`. */
export function resolveResidentRole(
  residentUuid: string,
  mayorUuid: string | null,
  ranks: string | null
): ResidentRole {
  if (mayorUuid && residentUuid === mayorUuid) return "mayor";
  if (ranks?.split(",").includes(DEPUTY_RANK)) return "deputy";
  return null;
}

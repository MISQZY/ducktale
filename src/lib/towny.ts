import { Prisma } from "@prisma/client";
import type { ResidentRole } from "@/types/towny";

export const DEPUTY_RANK = "vice";

/**
 * Town + nation + claimed-block-count join, shared by /api/towns (the docs
 * table) and /api/leaderboard/towns (ranked by the same size metric) —
 * the only two places this network's town roster gets queried from.
 * `extraColumns` lets a caller tack on its own columns (e.g. the docs
 * route's uuid/mayorUuid, needed to resolve residents) without duplicating
 * the join itself.
 */
export function townBaseQuery(extraColumns: Prisma.Sql = Prisma.empty) {
  return Prisma.sql`
    SELECT
      t.name AS name,
      t.tag AS tag,
      n.name AS nation,
      n.tag AS nationTag,
      (SELECT COUNT(*) FROM TOWNY_TOWNBLOCKS tb WHERE tb.town = t.uuid) AS size
      ${extraColumns}
    FROM TOWNY_TOWNS t
    LEFT JOIN TOWNY_NATIONS n ON n.uuid = t.nation
  `;
}

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

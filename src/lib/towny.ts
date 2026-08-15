import { Prisma } from "@prisma/client";
import type { Resident, ResidentRole } from "@/types/towny";

export const DEPUTY_RANK = "vice";

/**
 * Town + nation + claimed-block-count join, shared by /api/towns (the docs
 * table) and /api/leaderboard?type=towns (ranked by the same size metric) —
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

const ROLE_ORDER: Record<Exclude<ResidentRole, null>, number> = { mayor: 0, deputy: 1 };

export interface ResidentRow {
  name:  string;
  uuid:  string;
  town:  string;
  ranks: string | null;
}

/**
 * Resolves + sorts (mayor, then deputy, then everyone else, alphabetically
 * within each group) a town's raw TOWNY_RESIDENTS rows into display-ready
 * Resident[] — shared by /api/towns and /api/leaderboard?type=towns, the
 * only two places a town's resident list gets assembled.
 *
 * fallbackNickname and skinUrls are caller-supplied params (not resolved in
 * here via @/lib/players / @/lib/skin) on purpose — this module is imported
 * by client components (TownCells.tsx) for RESIDENT_ROLE_COLOR/ResidentRow,
 * and both of those libs transitively pull in @/lib/db's Prisma runtime,
 * which Turbopack can't put in a browser chunk ("does not support external
 * modules: node:module").
 */
export function assembleResidents(
  rows: ResidentRow[],
  mayorUuid: string | null,
  nicknames: Map<string, string | null>,
  fallbackNickname: string,
  skinUrls: Map<string, string | null>
): Resident[] {
  return rows
    .map((r) => ({ row: r, role: resolveResidentRole(r.uuid, mayorUuid, r.ranks) }))
    .sort((a, b) => {
      const rank = (role: ResidentRole) => role === null ? 2 : ROLE_ORDER[role];
      const byRole = rank(a.role) - rank(b.role);
      return byRole !== 0 ? byRole : a.row.name.localeCompare(b.row.name);
    })
    .map(({ row, role }) => ({
      nickname: nicknames.get(row.name) ?? fallbackNickname,
      username: row.name,
      skinUrl:  skinUrls.get(row.uuid) ?? null,
      role,
    }));
}

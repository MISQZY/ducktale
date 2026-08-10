import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { resolveResidentRole } from "@/lib/towny";
import { Prisma } from "@prisma/client";
import type { Resident, ResidentRole, Town, TownyResponse } from "@/types/towny";

export type { Town, TownyResponse };

interface TownRow {
  name:      string;
  tag:       string | null;
  uuid:      string;
  mayorUuid: string | null;
  nation:    string | null;
  nationTag: string | null;
  size:      bigint;
  total:     bigint;
}

interface ResidentRow {
  name:  string;
  uuid:  string;
  town:  string;
  ranks: string | null;
}

const FALLBACK_NICKNAME = "Путник";

/** Looks up FlectonePulse nicknames for a batch of usernames in one query. */
async function resolveNicknames(usernames: string[]): Promise<Map<string, string | null>> {
  if (usernames.length === 0) return new Map();

  const rows = await withDb(async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT p.name, s.value AS nickname
      FROM fp_player p
      LEFT JOIN fp_setting s ON s.player = p.id AND s.type = 'NICKNAME'
      WHERE p.name IN (${Prisma.join(usernames)})
    `) as { name: string; nickname: string | null }[];
  });

  return new Map(rows.map((r) => [r.name, r.nickname]));
}

const ROLE_ORDER: Record<Exclude<ResidentRole, null>, number> = { mayor: 0, deputy: 1 };

// The full town+resident+nickname assembly below is 3 sequential DB
// round-trips across 2 databases — cache the whole response per (page,
// search) combo so repeat requests within the window skip all of it.
const TOWNS_TTL_MS = 60_000;

async function buildTownsResponse(page: number, pageSize: number, search: string): Promise<TownyResponse> {
  const offset = (page - 1) * pageSize;

  const { townRows, residentRows } = await withDb("duckburg_towns", async (db) => {
    const townRows = await db.$queryRaw(Prisma.sql`
      SELECT
        t.name AS name,
        t.tag AS tag,
        t.uuid AS uuid,
        t.mayor AS mayorUuid,
        n.name AS nation,
        n.tag AS nationTag,
        (SELECT COUNT(*) FROM TOWNY_TOWNBLOCKS tb WHERE tb.town = t.uuid) AS size,
        COUNT(*) OVER() AS total
      FROM TOWNY_TOWNS t
      LEFT JOIN TOWNY_NATIONS n ON n.uuid = t.nation
      ${search ? Prisma.sql`WHERE t.name LIKE ${"%" + search + "%"}` : Prisma.empty}
      ORDER BY size DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as TownRow[];

    const townUuids = townRows.map((t) => t.uuid);
    const residentRows = townUuids.length === 0 ? [] : await db.$queryRaw(Prisma.sql`
      SELECT r.name AS name, r.uuid AS uuid, r.town AS town, r.\`town-ranks\` AS ranks
      FROM TOWNY_RESIDENTS r
      WHERE r.town IN (${Prisma.join(townUuids)})
    `) as ResidentRow[];

    return { townRows, residentRows };
  });

  const total = townRows.length > 0 ? Number(townRows[0].total) : 0;

  const nicknames = await resolveNicknames(residentRows.map((r) => r.name));

  const residentsByTown = new Map<string, ResidentRow[]>();
  for (const r of residentRows) {
    const list = residentsByTown.get(r.town) ?? [];
    list.push(r);
    residentsByTown.set(r.town, list);
  }

  const result: TownyResponse = {
    towns: townRows.map((t): Town => {
      const residents: Resident[] = (residentsByTown.get(t.uuid) ?? [])
        .map((r) => ({ row: r, role: resolveResidentRole(r.uuid, t.mayorUuid, r.ranks) }))
        .sort((a, b) => {
          const rank = (role: ResidentRole) => role === null ? 2 : ROLE_ORDER[role];
          const byRole = rank(a.role) - rank(b.role);
          return byRole !== 0 ? byRole : a.row.name.localeCompare(b.row.name);
        })
        .map(({ row, role }) => ({
          display: `${nicknames.get(row.name) ?? FALLBACK_NICKNAME} (${row.name})`,
          role,
        }));

      return {
        name:      t.name,
        tag:       t.tag,
        nation:    t.nation,
        nationTag: t.nationTag,
        size:      Number(t.size),
        residents,
      };
    }),
    total, page, pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };

  return result;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1",  10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const search   = searchParams.get("search")?.trim() ?? "";

  try {
    const result = await withCache(
      `towns:${page}:${pageSize}:${search.toLowerCase()}`,
      TOWNS_TTL_MS,
      () => buildTownsResponse(page, pageSize, search)
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("[towns] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch towns" }, { status: 500 });
  }
}

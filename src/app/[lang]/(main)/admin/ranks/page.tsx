import { getTranslations } from "next-intl/server";
import type { Prisma } from ".prisma/site-client";
import { Plus } from "lucide-react";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole } from "@/config/resource-roles";
import { siteDb } from "@/lib/site-db";
import { withDb } from "@/lib/db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { RankFormDialog } from "@/components/admin/RankFormDialog";
import { AdminRanksTable } from "@/components/admin/AdminRanksTable";
import { Button } from "@/components/ui/button";
import type { LocalizedName } from "@/lib/i18n-name";

/** group -> which lp_tracks it appears in — read-only context shown next to each row so an admin styling a group can see where it actually ranks, without cross-referencing the LuckPerms server separately. */
async function resolveTracksByGroup(): Promise<Map<string, string[]>> {
  const tracks = await withDb("luckperms", (db) => db.lp_tracks.findMany());
  const byGroup = new Map<string, string[]>();

  for (const track of tracks) {
    let groups: unknown;
    try {
      groups = JSON.parse(track.groups);
    } catch {
      groups = [];
    }
    if (!Array.isArray(groups)) continue;

    for (const group of groups) {
      if (typeof group !== "string") continue;
      const list = byGroup.get(group) ?? [];
      list.push(track.name);
      byGroup.set(group, list);
    }
  }

  return byGroup;
}

/** Every group LuckPerms actually has (lp_groups) — the full catalog, including ones with no track membership and ones nobody currently holds, so the picker doesn't miss standalone/perk groups like "supporter". */
async function resolveAllGroups(): Promise<string[]> {
  const groups = await withDb("luckperms", (db) => db.lp_groups.findMany({ select: { name: true } }));
  return groups.map((g) => g.name);
}

async function resolveGroupUserCounts(): Promise<Map<string, number>> {
  const rows = await withDb("luckperms", (db) =>
    db.$queryRaw`
      SELECT permission, COUNT(DISTINCT uuid) as cnt
      FROM lp_user_permissions
      WHERE permission LIKE 'group.%'
        AND value = 1
        AND (expiry = 0 OR expiry > UNIX_TIMESTAMP())
      GROUP BY permission
    `
  ) as { permission: string, cnt: bigint }[];

  const map = new Map<string, number>();
  for (const r of rows) {
    const group = r.permission.slice(6); // remove 'group.'
    map.set(group, Number(r.cnt));
  }
  return map;
}

// Allowlist, not a raw column passthrough — searchParams are user input.
// "name" no longer maps to an actually-orderable DB column (Json, same
// tradeoff as Role.name/Badge.name) — kept as a selectable sortKey so the
// header still shows as sortable, backed by createdAt instead.
const SORTABLE = {
  name: "createdAt",
  group: "group",
} as const satisfies Record<string, keyof Prisma.LuckPermsRoleOrderByWithRelationInput>;

export default async function AdminRanksPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "ranks-view");
  const navAccess = await getAdminNavAccess();
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "ranks-edit");
  const canDelete = admin.isAdmin || hasResourceRole(admin.roles, "ranks-delete");
  const { sort: rawSort, order: rawOrder } = await searchParams;

  const sortDir: "asc" | "desc" = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : "asc";
  const sortKey = (rawSort && rawSort in SORTABLE ? rawSort : "name") as keyof typeof SORTABLE;
  const orderBy: Prisma.LuckPermsRoleOrderByWithRelationInput = { [SORTABLE[sortKey]]: sortDir };

  const rankRows = await siteDb.luckPermsRole.findMany({ orderBy });
  const ranks = rankRows.map((r) => ({ ...r, name: r.name as unknown as LocalizedName }));
  const tracksByGroup = await resolveTracksByGroup().catch(() => new Map<string, string[]>()); // LuckPerms DB unreachable shouldn't break this whole admin page
  const allGroups = await resolveAllGroups().catch(() => [] as string[]);
  const userCounts = await resolveGroupUserCounts().catch(() => new Map<string, number>());

  const groupSuggestions = [...new Set([...allGroups, ...tracksByGroup.keys(), ...ranks.map((r) => r.group)])].sort();

  const t = await getTranslations("Admin");
  const tr = await getTranslations("Admin.ranks");

  const createSlot = canEdit ? (
    <RankFormDialog
      lang={lang}
      groupSuggestions={groupSuggestions}
      trigger={
        <Button variant="outline" size="icon" title={tr("createTitle")} aria-label={tr("createTitle")}>
          <Plus size={16} />
        </Button>
      }
    />
  ) : undefined;

  return (
    <AdminPageShell title={t("ranksTitle")} description={tr("description", { count: ranks.length })} active="ranks" navAccess={navAccess}>
      <AdminRanksTable
        lang={lang}
        ranks={ranks}
        tracksByGroup={[...tracksByGroup.entries()]}
        userCounts={[...userCounts.entries()]}
        groupSuggestions={groupSuggestions}
        canEdit={canEdit}
        canDelete={canDelete}
        sortColumn={sortKey}
        sortDirection={sortDir}
        createSlot={createSlot}
      />
    </AdminPageShell>
  );
}

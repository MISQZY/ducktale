import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { withDb } from "@/lib/db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { RoleFormDialog } from "@/components/admin/RoleFormDialog";
import { AdminRolesTable } from "@/components/admin/AdminRolesTable";
import { FormButton } from "@/components/common/FormButton";

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

export default async function AdminRolesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  await requireAdmin(lang);

  const roles = await siteDb.luckPermsRole.findMany({ orderBy: { name: "asc" } });
  const tracksByGroup = await resolveTracksByGroup().catch(() => new Map<string, string[]>()); // LuckPerms DB unreachable shouldn't break this whole admin page
  const allGroups = await resolveAllGroups().catch(() => [] as string[]);
  const userCounts = await resolveGroupUserCounts().catch(() => new Map<string, number>());

  const groupSuggestions = [...new Set([...allGroups, ...tracksByGroup.keys(), ...roles.map((r) => r.group)])].sort();

  const t = await getTranslations("Admin");
  const tr = await getTranslations("Admin.roles");

  return (
    <AdminPageShell title={t("rolesTitle")} description={tr("description", { count: roles.length })} active="roles">
      <div className="w-full">
        <div className="flex justify-center mb-6">
          <RoleFormDialog
            lang={lang}
            groupSuggestions={groupSuggestions}
            trigger={<FormButton className="px-5 py-2 text-xs">{tr("createTitle")}</FormButton>}
          />
        </div>

        <div className="min-h-[42vh]">
          <AdminRolesTable
            lang={lang}
            roles={roles}
            tracksByGroup={[...tracksByGroup.entries()]}
            userCounts={[...userCounts.entries()]}
            groupSuggestions={groupSuggestions}
          />
        </div>
      </div>
    </AdminPageShell>
  );
}

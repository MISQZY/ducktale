import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { withDb } from "@/lib/db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { RoleFormDialog } from "@/components/admin/RoleFormDialog";
import { RoleRowActions } from "@/components/admin/RoleRowActions";
import { RoleUsersDialog } from "@/components/admin/RoleUsersDialog";
import { FormButton } from "@/components/common/FormButton";
import { cn } from "@/lib/utils";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";

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
          <DocsTable>
            <DocsTableHeader>
              <DocsTableRow>
                <DocsTableHead className="w-[250px] align-middle" withRightBorder>{tr("nameLabel")}</DocsTableHead>
                <DocsTableHead className="align-middle" withRightBorder>{tr("groupLabel")}</DocsTableHead>
                <DocsTableHead className="align-middle" withRightBorder>{tr("tracksLabel")}</DocsTableHead>
                <DocsTableHead className="w-[120px] text-center align-middle" withRightBorder>Пользователи</DocsTableHead>
                <DocsTableHead className="w-[120px] align-middle text-right">{t("actionsColumn")}</DocsTableHead>
              </DocsTableRow>
            </DocsTableHeader>
            <DocsTableBody className="[&_tr:last-child]:border-0">
              {roles.length === 0 ? (
                <DocsTableRow>
                  <DocsTableCell colSpan={5} className="text-center py-10">
                    <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>{tr("noResults")}</p>
                  </DocsTableCell>
                </DocsTableRow>
              ) : (
                roles.map((role) => (
                  <DocsTableRow key={role.id}>
                    <DocsTableCell className="align-middle" withRightBorder>
                      <span className="inline-flex items-center gap-2">
                        <BadgeIcon name={role.icon} size={16} style={{ color: role.color ?? undefined }} />
                        {role.name}
                      </span>
                    </DocsTableCell>
                    <DocsTableCell className="align-middle font-mono text-xs text-foreground/60" withRightBorder>
                      {role.group}
                    </DocsTableCell>
                    <DocsTableCell className="align-middle text-xs text-foreground/50" withRightBorder>
                      {(tracksByGroup.get(role.group) ?? []).join(", ") || "—"}
                    </DocsTableCell>
                    <DocsTableCell className="align-middle text-center" withRightBorder>
                      <RoleUsersDialog
                        lang={lang}
                        group={role.group}
                        count={userCounts.get(role.group) || 0}
                      />
                    </DocsTableCell>
                    <DocsTableCell className="align-middle text-right">
                      <RoleRowActions lang={lang} role={role} groupSuggestions={groupSuggestions} />
                    </DocsTableCell>
                  </DocsTableRow>
                ))
              )}
            </DocsTableBody>
          </DocsTable>
        </div>
      </div>
    </AdminPageShell>
  );
}

import { getTranslations } from "next-intl/server";
import type { Prisma } from ".prisma/site-client";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole } from "@/config/resource-roles";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinBadges } from "@/lib/badges";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { BadgeFormDialog } from "@/components/admin/BadgeFormDialog";
import { AdminBadgesTable } from "@/components/admin/AdminBadgesTable";
import { FormButton } from "@/components/common/FormButton";
import { ServerPagination } from "@/components/common/ServerPagination";
import type { LocalizedName } from "@/lib/i18n-name";

const PAGE_SIZE = 10;

// "awarded" isn't a plain field (it's a relation count), so it doesn't fit
// the single-field allowlist the other admin pages use — special-cased below.
const SORTABLE_KEYS = ["badge", "awarded"] as const;
type SortKey = (typeof SORTABLE_KEYS)[number];

export default async function AdminBadgesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string; sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "badges-view");
  const navAccess = await getAdminNavAccess();
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "badges-edit");
  const canDelete = admin.isAdmin || hasResourceRole(admin.roles, "badges-delete");
  const { page: rawPage, sort: rawSort, order: rawOrder } = await searchParams;

  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const sortDir: "asc" | "desc" = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : "asc";
  const sortKey: SortKey | undefined = SORTABLE_KEYS.includes(rawSort as SortKey) ? (rawSort as SortKey) : undefined;
  // "badge" (name) can't be sorted at the DB level any more — name is now a
  // Json column ({ru, en}), and MySQL/Prisma JSON ordering isn't practical
  // here (same tradeoff already made for Role.name/ResourceRoleLabel.name
  // earlier). Falls back to createdAt order — the sortKey stays selectable
  // in the UI (header still shows as sortable), it just no longer changes
  // the actual query.
  const orderBy: Prisma.BadgeOrderByWithRelationInput =
    sortKey === "awarded" ? { userBadges: { _count: sortDir } }
    : { createdAt: "asc" };

  // Idempotent (createMany + skipDuplicates) — cheap enough to run on every
  // load, guarantees the code-defined catalog always shows up here even if
  // this is the very first time anyone's visited this page.
  await seedBuiltinBadges();

  const badgeRows = await siteDb.badge.findMany({
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true, name: true, description: true, earnCondition: true, icon: true, color: true,
      autoRoles: { select: { roleId: true } },
      _count: { select: { userBadges: true } },
    },
  });

  const total = await siteDb.badge.count();

  const roleOptions = await siteDb.luckPermsRole.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, group: true, name: true },
  });

  const badges = badgeRows.map(({ autoRoles, ...badge }) => ({
    ...badge,
    name: badge.name as unknown as LocalizedName,
    autoRoleIds: autoRoles.map((ar) => ar.roleId),
  }));

  const roleOptionsTyped = roleOptions.map((r) => ({ ...r, name: r.name as unknown as LocalizedName }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const t = await getTranslations("Admin");
  const tb = await getTranslations("Admin.badges");

  return (
    <AdminPageShell title={t("badgesTitle")} description={tb("description", { count: total })} active="badges" navAccess={navAccess}>
      <div className="w-full">
        {canEdit && (
          <div className="flex justify-center mb-6">
            <BadgeFormDialog
              lang={lang}
              roleOptions={roleOptionsTyped}
              trigger={<FormButton className="px-5 py-2 text-xs">{tb("createTitle")}</FormButton>}
            />
          </div>
        )}

        <div className="min-h-[42vh]">
          <AdminBadgesTable lang={lang} badges={badges} roleOptions={roleOptionsTyped} canEdit={canEdit} canDelete={canDelete} sortColumn={sortKey} sortDirection={sortKey ? sortDir : undefined} rowOffset={(page - 1) * PAGE_SIZE} />
        </div>

        <ServerPagination
          page={page}
          totalPages={totalPages}
          pathname="/admin/badges"
          buildQuery={(p) => ({ ...(sortKey ? { sort: sortKey, order: sortDir } : {}), page: String(p) })}
          prevText={t("prevPage")}
          nextText={t("nextPage")}
        />
      </div>
    </AdminPageShell>
  );
}

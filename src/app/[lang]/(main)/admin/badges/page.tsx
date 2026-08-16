import { getTranslations } from "next-intl/server";
import type { Prisma } from ".prisma/site-client";
import { Plus } from "lucide-react";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole } from "@/config/resource-roles";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinBadges } from "@/lib/badges";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { BadgeFormDialog } from "@/components/admin/BadgeFormDialog";
import { AdminBadgesTable } from "@/components/admin/AdminBadgesTable";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/docs/paged-table/TablePagination";
import { resolvePageSize } from "@/lib/pagination";
import type { LocalizedName } from "@/lib/i18n-name";

// Default/fallback only — useAdaptivePageSize (client-side, in
// AdminBadgesTable) overrides this via ?pageSize= to whatever count
// actually fills the viewport, so this is just what a fresh, JS-less first
// load uses.
const DEFAULT_PAGE_SIZE = 10;

// "awarded" isn't a plain field (it's a relation count), so it doesn't fit
// the single-field allowlist the other admin pages use — special-cased below.
const SORTABLE_KEYS = ["badge", "awarded"] as const;
type SortKey = (typeof SORTABLE_KEYS)[number];

export default async function AdminBadgesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string; sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "badges-view");
  const navAccess = await getAdminNavAccess();
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "badges-edit");
  const canDelete = admin.isAdmin || hasResourceRole(admin.roles, "badges-delete");
  const { page: rawPage, pageSize: rawPageSize, sort: rawSort, order: rawOrder } = await searchParams;

  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const PAGE_SIZE = resolvePageSize(rawPageSize, DEFAULT_PAGE_SIZE);
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

  const createSlot = canEdit ? (
    <BadgeFormDialog
      lang={lang}
      roleOptions={roleOptionsTyped}
      trigger={
        <Button variant="outline" size="icon" title={tb("createTitle")} aria-label={tb("createTitle")}>
          <Plus size={16} />
        </Button>
      }
    />
  ) : undefined;

  return (
    <AdminPageShell title={t("badgesTitle")} description={tb("description", { count: total })} active="badges" navAccess={navAccess}>
      <div className="w-full">
        <AdminBadgesTable lang={lang} badges={badges} roleOptions={roleOptionsTyped} canEdit={canEdit} canDelete={canDelete} sortColumn={sortKey} sortDirection={sortKey ? sortDir : undefined} rowOffset={(page - 1) * PAGE_SIZE} createSlot={createSlot} pageSize={PAGE_SIZE} />

        <div className="mt-6">
          <TablePagination
            page={page}
            totalPages={totalPages}
            pageStart={(page - 1) * PAGE_SIZE}
            pageSize={PAGE_SIZE}
            total={total}
            hrefBase={{
              pathname: "/admin/badges",
              query: {
                ...(sortKey ? { sort: sortKey, order: sortDir } : {}),
                ...(rawPageSize ? { pageSize: String(PAGE_SIZE) } : {}),
              },
            }}
          />
        </div>
      </div>
    </AdminPageShell>
  );
}

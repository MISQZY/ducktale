import { getTranslations } from "next-intl/server";
import type { Prisma } from ".prisma/site-client";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole } from "@/config/resource-roles";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinBadges } from "@/lib/badges";
import { isUserOnline } from "@/lib/presence";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import type { RoleOption } from "@/components/admin/RoleFormDialog";
import type { LocalizedName } from "@/lib/i18n-name";

import { SearchInput } from "@/components/ui/search-input";
import { TablePagination } from "@/components/docs/paged-table/TablePagination";
import { resolvePageSize } from "@/lib/pagination";

// Default/fallback only — useAdaptivePageSize (client-side, in
// AdminUsersTable) overrides this via ?pageSize= to whatever count actually
// fills the viewport, so this is just what a fresh, JS-less first load uses.
// Smaller than the other admin tables' default — each row here is taller
// (avatar + badges + two presence lines).
const DEFAULT_PAGE_SIZE = 8;

// Allowlist, not a raw column passthrough — searchParams are user input, and
// only these two columns are meaningful to sort a user list by.
const SORTABLE = {
  user: "nickname",
  registration: "createdAt",
} as const satisfies Record<string, keyof Prisma.UserOrderByWithRelationInput>;

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ search?: string; page?: string; pageSize?: string; sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "users-view");
  const navAccess = await getAdminNavAccess();
  // Reachable by a users-view-only holder now, so the table/dialog need to
  // know which mutating controls they're actually allowed to use — badges
  // and Roles are both awarded/assigned inline from this same table, hence
  // the separate badges-edit/role-edit checks alongside users-edit.
  const canEditUsers = admin.isAdmin || hasResourceRole(admin.roles, "users-edit");
  const canDeleteUsers = admin.isAdmin || hasResourceRole(admin.roles, "users-delete");
  const canEditBadges = admin.isAdmin || hasResourceRole(admin.roles, "badges-edit");
  const canManageRoles = admin.isAdmin || hasResourceRole(admin.roles, "role-edit");
  const { search: rawSearch, page: rawPage, pageSize: rawPageSize, sort: rawSort, order: rawOrder } = await searchParams;

  const search = rawSearch?.trim() ?? "";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const PAGE_SIZE = resolvePageSize(rawPageSize, DEFAULT_PAGE_SIZE);
  const sortDir: "asc" | "desc" = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : "asc";
  const sortKey = (rawSort && rawSort in SORTABLE ? rawSort : "registration") as keyof typeof SORTABLE;
  const orderBy: Prisma.UserOrderByWithRelationInput = { [SORTABLE[sortKey]]: sortDir };

  const t = await getTranslations("Admin");

  // Relies on the site DB's case-insensitive collation (same as elsewhere
  // in this codebase) — no explicit `mode: "insensitive"` needed.
  const where = search ? { nickname: { contains: search } } : undefined;

  // Seeded here too (not just on /admin/badges) so the picker below always
  // offers the built-in catalog even if nobody's visited the badges page yet.
  await seedBuiltinBadges();

  const [users, total, badges, roleRows] = await Promise.all([
    siteDb.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        nickname: true,
        isAdmin: true,
        createdAt: true,
        lastSeenAt: true,
        accountLink: { select: { status: true, minecraftName: true, minecraftUuid: true } },
        badges: { select: { badge: { select: { id: true, name: true, icon: true, color: true } } } },
        roles: { select: { roleId: true } },
      },
    }),
    siteDb.user.count({ where }),
    siteDb.badge.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, icon: true, color: true } }),
    siteDb.role.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, key: true } }),
  ]);

  const badgesTyped = badges.map((b) => ({ ...b, name: b.name as unknown as LocalizedName }));

  // "Гостевая" is excluded — it only means anything for anonymous (no
  // session) visitors, assigning it to a real account doesn't actually
  // restrict them (see assertAssignableToUser's doc comment, src/lib/
  // actions/admin-roles.ts), so it isn't offered here at all.
  const roleOptions: RoleOption[] = roleRows
    .filter((r) => r.key !== "guest")
    .map((r) => ({ id: r.id, name: r.name as unknown as LocalizedName }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const dateLocale = lang === "ru" ? "ru-RU" : "en-US";

  const linkedUuids = users
    .map(u => u.accountLink?.status === "CONFIRMED" ? u.accountLink.minecraftUuid : null)
    .filter((u): u is string => !!u);

  const [{ resolveSkinUrls }, { getAllOnlinePlayers, getPlayersLastSeenMap }] = await Promise.all([
    import("@/lib/skin"),
    import("@/lib/players"),
  ]);

  // Independent lookups — run together instead of awaiting one at a time.
  const [skinUrls, onlinePlayers, serverLastSeenMap] = await Promise.all([
    resolveSkinUrls(users.map((u) => u.accountLink?.minecraftUuid)),
    getAllOnlinePlayers(),
    linkedUuids.length > 0 ? getPlayersLastSeenMap(linkedUuids) : Promise.resolve(new Map<string, number>()),
  ]);
  const onlineMcNames = new Set(onlinePlayers.map(p => p.name.toLowerCase()));

  const userRows = users.map((user, i) => {
    const isLinked = user.accountLink?.status === "CONFIRMED";
    const mcOnline = isLinked && user.accountLink?.minecraftName ? onlineMcNames.has(user.accountLink.minecraftName.toLowerCase()) : false;
    const serverLastSeenMs = isLinked && user.accountLink?.minecraftUuid ? serverLastSeenMap.get(user.accountLink.minecraftUuid) ?? null : null;

    return {
      id: user.id,
      nickname: user.nickname,
      isAdmin: user.isAdmin,
      isSelf: user.id === admin.id,
      createdAtLabel: user.createdAt.toLocaleDateString(dateLocale),
      skinUrl: skinUrls[i],
      isLinked,
      isPending: user.accountLink?.status === "PENDING",
      linkedName: user.accountLink?.minecraftName ?? null,
      siteOnline: isUserOnline(user.id),
      siteLastSeenMs: user.lastSeenAt?.getTime() ?? null,
      mcOnline,
      serverLastSeenMs,
      badgeIds: user.badges.map(({ badge }) => badge.id),
      roleIds: user.roles.map((r) => r.roleId),
    };
  });

  const searchSlot = (
    <form className="w-full max-w-xs">
      <SearchInput name="search" defaultValue={search} placeholder={t("searchPlaceholder")} />
    </form>
  );

  return (
    <AdminPageShell title={t("navUsers")} description={t("description", { count: total })} active="users" navAccess={navAccess}>
      <div className="w-full">
        <AdminUsersTable
          lang={lang}
          users={userRows}
          badges={badgesTyped}
          roleOptions={roleOptions}
          canEditUsers={canEditUsers}
          canDeleteUsers={canDeleteUsers}
          canEditBadges={canEditBadges}
          canManageRoles={canManageRoles}
          sortColumn={sortKey}
          sortDirection={sortDir}
          rowOffset={(page - 1) * PAGE_SIZE}
          searchSlot={searchSlot}
          pageSize={PAGE_SIZE}
        />

        <div className="mt-6">
          <TablePagination
            page={page}
            totalPages={totalPages}
            pageStart={(page - 1) * PAGE_SIZE}
            pageSize={PAGE_SIZE}
            total={total}
            hrefBase={{
              pathname: "/admin/users",
              query: {
                ...(search ? { search } : {}),
                ...(rawSort && rawSort in SORTABLE ? { sort: sortKey, order: sortDir } : {}),
                ...(rawPageSize ? { pageSize: String(PAGE_SIZE) } : {}),
              },
            }}
          />
        </div>
      </div>
    </AdminPageShell>
  );
}

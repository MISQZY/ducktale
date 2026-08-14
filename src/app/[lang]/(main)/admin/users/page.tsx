import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinBadges } from "@/lib/badges";
import { isUserOnline } from "@/lib/presence";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

import { SearchInput } from "@/components/ui/search-input";
import { ServerPagination } from "@/components/common/ServerPagination";

const PAGE_SIZE = 10;

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { lang } = await params;
  const admin = await requireAdmin(lang);
  const { search: rawSearch, page: rawPage } = await searchParams;

  const search = rawSearch?.trim() ?? "";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const t = await getTranslations("Admin");

  // Relies on the site DB's case-insensitive collation (same as elsewhere
  // in this codebase) — no explicit `mode: "insensitive"` needed.
  const where = search ? { nickname: { contains: search } } : undefined;

  // Seeded here too (not just on /admin/badges) so the picker below always
  // offers the built-in catalog even if nobody's visited the badges page yet.
  await seedBuiltinBadges();

  const [users, total, badges] = await Promise.all([
    siteDb.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
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
      },
    }),
    siteDb.user.count({ where }),
    siteDb.badge.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, icon: true, color: true } }),
  ]);

  const { resolveSkinUrls } = await import("@/lib/skin");
  const skinUrls = await resolveSkinUrls(users.map((u) => u.accountLink?.minecraftUuid));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const dateLocale = lang === "ru" ? "ru-RU" : "en-US";

  const { getAllOnlinePlayers } = await import("@/lib/players");
  const onlinePlayers = await getAllOnlinePlayers();
  const onlineMcNames = new Set(onlinePlayers.map(p => p.name.toLowerCase()));

  const linkedUuids = users
    .map(u => u.accountLink?.status === "CONFIRMED" ? u.accountLink.minecraftUuid : null)
    .filter((u): u is string => !!u);

  const serverLastSeenMap = new Map<string, number>();
  if (linkedUuids.length > 0) {
    const { withDb } = await import("@/lib/db");
    const players = await withDb(db => db.fp_player.findMany({
      where: { uuid: { in: linkedUuids } },
      select: { uuid: true, fp_time: { select: { last: true } } }
    }));
    for (const p of players) {
      if (p.fp_time?.last) {
        serverLastSeenMap.set(p.uuid, Number(p.fp_time.last));
      }
    }
  }

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
    };
  });

  return (
    <AdminPageShell title={t("navUsers")} description={t("description", { count: total })} active="users">
      <div className="w-full">
        <form className="mb-6 flex justify-center">
          <SearchInput
            name="search"
            defaultValue={search}
            placeholder={t("searchPlaceholder")}
            wrapperClassName="max-w-sm"
          />
        </form>

        <div className="min-h-[42vh]">
          <AdminUsersTable lang={lang} users={userRows} badges={badges} />
        </div>

        <ServerPagination
          page={page}
          totalPages={totalPages}
          pathname="/admin/users"
          buildQuery={(p) => ({ ...(search ? { search } : {}), page: String(p) })}
          prevText={t("prevPage")}
          nextText={t("nextPage")}
        />
      </div>
    </AdminPageShell>
  );
}

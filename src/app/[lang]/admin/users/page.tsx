import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinBadges } from "@/lib/badges";
import { isUserOnline } from "@/lib/presence";
import { formatLastSeen } from "@/lib/player-card-format";

import { AdminPageShell } from "@/components/admin/AdminPageShell";

import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { UserBadgesCell } from "@/components/admin/UserBadgesCell";

import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { ShieldAlert } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";
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
  const tc = await getTranslations("PlayerCard");

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
          <DocsTable>
            <DocsTableHeader>
              <DocsTableRow>
                <DocsTableHead className="w-[240px] align-middle" withRightBorder>{t("userColumn")}</DocsTableHead>
                <DocsTableHead className="align-middle" withRightBorder>{t("badgesLabel")}</DocsTableHead>
                <DocsTableHead className="w-[180px] align-middle text-left" withRightBorder>{tc("lastSeenOnSite", { date: "" }).split(":")[0] || "Last seen"}</DocsTableHead>
                <DocsTableHead className="w-[120px] align-middle text-center" withRightBorder>{t("registrationColumn")}</DocsTableHead>
                <DocsTableHead className="w-[180px] align-middle text-right">{t("actionsColumn")}</DocsTableHead>
              </DocsTableRow>
            </DocsTableHeader>
            <DocsTableBody className="[&_tr:last-child]:border-0">
              {users.length === 0 ? (
                <DocsTableRow>
                  <DocsTableCell colSpan={5} className="text-center py-10">
                    <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>{t("noResults")}</p>
                  </DocsTableCell>
                </DocsTableRow>
              ) : (
                users.map((user, i) => {
                  const siteOnline = isUserOnline(user.id);
                  const siteLastSeenMs = user.lastSeenAt?.getTime() ?? null;
                  
                  const isLinked = user.accountLink?.status === "CONFIRMED";
                  const mcOnline = isLinked && user.accountLink?.minecraftName ? onlineMcNames.has(user.accountLink.minecraftName.toLowerCase()) : false;
                  const serverLastSeenMs = isLinked && user.accountLink?.minecraftUuid ? serverLastSeenMap.get(user.accountLink.minecraftUuid) : null;

                  return (
                    <DocsTableRow key={user.id}>
                      <DocsTableCell className="align-middle" withRightBorder>
                        <div className="flex flex-col gap-1.5">
                          <PlayerAvatar
                            name={user.nickname}
                            skinUrl={skinUrls[i]}
                            hasSiteProfile={true}
                            linked={isLinked}
                            siteOnline={siteOnline}
                            online={mcOnline}
                            appendNode={
                              user.isAdmin ? (
                                <span title={t("adminBadge")} className="flex shrink-0">
                                  <ShieldAlert size={14} className="text-primary/70" />
                                </span>
                              ) : null
                            }
                          />
                          <span className="text-foreground/45 text-xs">
                            {isLinked
                              ? t("linkedAs", { name: user.accountLink!.minecraftName ?? "" })
                              : user.accountLink?.status === "PENDING"
                                ? t("pending")
                                : t("notLinked")}
                          </span>
                        </div>
                      </DocsTableCell>

                      <DocsTableCell className="align-middle max-w-0" withRightBorder>
                        <UserBadgesCell
                          lang={lang}
                          userId={user.id}
                          badges={badges}
                          currentBadgeIds={user.badges.map(({ badge }) => badge.id)}
                        />
                      </DocsTableCell>

                      <DocsTableCell className="align-middle text-left" withRightBorder>
                        <div className="flex flex-col gap-1.5 justify-center">
                          <div className="flex items-center justify-start text-xs">
                            {siteOnline ? (
                              <span className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                                </span>
                                {tc("siteOnline")}
                              </span>
                            ) : siteLastSeenMs ? (
                              <span className="text-foreground/50">
                                Сайт: {formatLastSeen(siteLastSeenMs, lang)}
                              </span>
                            ) : (
                              <span className="text-foreground/30 italic">
                                Сайт: —
                              </span>
                            )}
                          </div>
                          {isLinked && (
                            <div className="flex items-center justify-start text-xs">
                              {mcOnline ? (
                                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                  </span>
                                  {tc("online")}
                                </span>
                              ) : serverLastSeenMs ? (
                                <span className="text-foreground/50">
                                  Сервер: {formatLastSeen(serverLastSeenMs, lang)}
                                </span>
                              ) : (
                                <span className="text-foreground/30 italic">
                                  Сервер: —
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </DocsTableCell>

                      <DocsTableCell className="align-middle text-center" withRightBorder>
                        <span className="text-foreground/50 text-xs">
                          {user.createdAt.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}
                        </span>
                      </DocsTableCell>

                      <DocsTableCell className="align-middle text-right">
                        <AdminUserActions
                          lang={lang}
                          userId={user.id}
                          nickname={user.nickname}
                          isSelf={user.id === admin.id}
                          hasLink={user.accountLink?.status === "CONFIRMED"}
                          isAdmin={user.isAdmin}
                        />
                      </DocsTableCell>
                    </DocsTableRow>
                  );
                })
              )}
            </DocsTableBody>
          </DocsTable>
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

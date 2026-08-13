import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinBadges } from "@/lib/badges";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BadgeChip } from "@/components/badges/BadgeChip";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { UserBadgesCell } from "@/components/admin/UserBadgesCell";
import { Link } from "@/i18n/navigation";
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
        accountLink: { select: { status: true, minecraftName: true } },
        badges: { select: { badge: { select: { id: true, name: true, icon: true, color: true } } } },
      },
    }),
    siteDb.user.count({ where }),
    siteDb.badge.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, icon: true, color: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminPageShell title={t("title")} description={t("description", { count: total })} active="users">
      <div className="w-full">
        <form className="mb-6 flex justify-center">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder={t("searchPlaceholder")}
            className="w-full max-w-sm rounded-xl border border-primary/20 bg-card/50 px-4 py-2 text-sm text-foreground/90 focus:outline-none focus:border-primary/50"
          />
        </form>

        <div className="min-h-[42vh]">
          <DocsTable>
            <DocsTableHeader>
              <DocsTableRow>
                <DocsTableHead className="w-[280px] align-middle" withRightBorder>{t("userColumn")}</DocsTableHead>
                <DocsTableHead className="align-middle" withRightBorder>{t("badgesLabel")}</DocsTableHead>
                <DocsTableHead className="w-[160px] align-middle text-center" withRightBorder>{t("registrationColumn")}</DocsTableHead>
                <DocsTableHead className="w-[180px] align-middle text-right">{t("actionsColumn")}</DocsTableHead>
              </DocsTableRow>
            </DocsTableHeader>
            <DocsTableBody className="[&_tr:last-child]:border-0">
              {users.length === 0 ? (
                <DocsTableRow>
                  <DocsTableCell colSpan={4} className="text-center py-10">
                    <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>{t("noResults")}</p>
                  </DocsTableCell>
                </DocsTableRow>
              ) : (
                users.map((user) => (
                  <DocsTableRow key={user.id}>
                    <DocsTableCell className="align-middle" withRightBorder>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/profile/${encodeURIComponent(user.nickname)}`}
                            target="_blank"
                            className="text-foreground/90 font-medium hover:text-primary/90 hover:underline underline-offset-4 transition-colors"
                          >
                            {user.nickname}
                          </Link>
                          {user.isAdmin && <StatusBadge label={t("adminBadge")} className="px-2 py-0.5 text-[0.6rem]" />}
                        </div>
                        <span className="text-foreground/45 text-xs">
                          {user.accountLink?.status === "CONFIRMED"
                            ? t("linkedAs", { name: user.accountLink.minecraftName ?? "" })
                            : user.accountLink?.status === "PENDING"
                              ? t("pending")
                              : t("notLinked")}
                        </span>
                      </div>
                    </DocsTableCell>

                    <DocsTableCell className="align-middle" withRightBorder>
                      <UserBadgesCell
                        lang={lang}
                        userId={user.id}
                        badges={badges}
                        currentBadgeIds={user.badges.map(({ badge }) => badge.id)}
                      />
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
                ))
              )}
            </DocsTableBody>
          </DocsTable>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link
              href={{ pathname: "/admin/users", query: { ...(search ? { search } : {}), page: String(Math.max(1, page - 1)) } }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs border border-primary/20 text-foreground/60 hover:text-foreground hover:border-primary/40 transition-colors",
                page <= 1 && "pointer-events-none opacity-30"
              )}
            >
              {t("prevPage")}
            </Link>
            <span className="text-xs text-foreground/50 tabular-nums">{t("pageInfo", { page, totalPages })}</span>
            <Link
              href={{ pathname: "/admin/users", query: { ...(search ? { search } : {}), page: String(Math.min(totalPages, page + 1)) } }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs border border-primary/20 text-foreground/60 hover:text-foreground hover:border-primary/40 transition-colors",
                page >= totalPages && "pointer-events-none opacity-30"
              )}
            >
              {t("nextPage")}
            </Link>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}

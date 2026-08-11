import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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

  const [users, total] = await Promise.all([
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
      },
    }),
    siteDb.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminPageShell title={t("title")} description={t("description", { count: total })} active="users">
      {/* Narrower than the shell on purpose — the shell's max-w-[1600px] is
          sized for /admin/content's tree+editor layout, but a stretched-out
          list of user rows (nickname far left, actions far right) looks
          broken at that width. This keeps the shell width consistent
          across admin pages while giving the list a comfortable reading
          width of its own. */}
      <div className="max-w-2xl mx-auto">
        <form className="mb-6 flex justify-center">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder={t("searchPlaceholder")}
            className="w-full max-w-sm rounded-xl border border-primary/20 bg-card/50 px-4 py-2 text-sm text-foreground/90 focus:outline-none focus:border-primary/50"
          />
        </form>

        <div className="space-y-4 min-h-[42vh]">
          {users.length === 0 ? (
            <p className="rounded-2xl border border-primary/20 bg-card/50 p-10 text-center text-foreground/40 text-sm">
              {t("noResults")}
            </p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="corner-ornament rounded-2xl border border-primary/20 bg-card/50 p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link
                    href={`/profile/${encodeURIComponent(user.nickname)}`}
                    target="_blank"
                    className="text-foreground/90 font-medium hover:text-primary/90 hover:underline underline-offset-4 transition-colors"
                  >
                    {user.nickname}
                  </Link>
                  {user.isAdmin && <StatusBadge label={t("adminBadge")} className="px-2.5 py-0.5 text-[0.6rem]" />}
                </div>
                <p className="text-foreground/40 text-xs">
                  {t("createdAt", { date: user.createdAt.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") })}
                </p>
                <p className="text-foreground/45 text-xs mt-1">
                  {user.accountLink?.status === "CONFIRMED"
                    ? t("linkedAs", { name: user.accountLink.minecraftName ?? "" })
                    : user.accountLink?.status === "PENDING"
                      ? t("pending")
                      : t("notLinked")}
                </p>

                <div className="mt-4 pt-4 border-t border-primary/10">
                  <AdminUserActions
                    lang={lang}
                    userId={user.id}
                    nickname={user.nickname}
                    isSelf={user.id === admin.id}
                    hasLink={user.accountLink?.status === "CONFIRMED"}
                    isAdmin={user.isAdmin}
                  />
                </div>
              </div>
            ))
          )}
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

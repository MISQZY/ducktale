import { getTranslations } from "next-intl/server";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminReportsTable } from "@/components/admin/AdminReportsTable";
import { isUserOnline } from "@/lib/presence";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { TablePagination } from "@/components/docs/paged-table/TablePagination";
import { resolvePageSize } from "@/lib/pagination";
import type { Prisma, ReportStatus } from ".prisma/site-client";

const DEFAULT_PAGE_SIZE = 10;
const STATUS_FILTERS = ["ALL", "OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// Allowlist, not a raw column passthrough — searchParams are user input.
const SORTABLE = {
  reported: "reportedName",
  status: "status",
  created: "createdAt",
} as const satisfies Record<string, keyof Prisma.ReportOrderByWithRelationInput>;

export default async function AdminReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string; sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  await requireResourceRole(lang, "reports-view");
  const navAccess = await getAdminNavAccess();
  const { search: rawSearch, status: rawStatus, page: rawPage, pageSize: rawPageSize, sort: rawSort, order: rawOrder } = await searchParams;

  const search = rawSearch?.trim() ?? "";
  const status: StatusFilter = STATUS_FILTERS.includes(rawStatus as StatusFilter) ? (rawStatus as StatusFilter) : "ALL";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const PAGE_SIZE = resolvePageSize(rawPageSize, DEFAULT_PAGE_SIZE);
  const sortDir: "asc" | "desc" = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : "desc";
  const sortKey = (rawSort && rawSort in SORTABLE ? rawSort : "created") as keyof typeof SORTABLE;
  const orderBy: Prisma.ReportOrderByWithRelationInput = { [SORTABLE[sortKey]]: sortDir };

  const tr = await getTranslations("Admin.reports");

  const where = {
    ...(status !== "ALL" ? { status: status as ReportStatus } : {}),
    ...(search
      ? {
          OR: [
            { reportedName: { contains: search } },
            { reporter: { nickname: { contains: search } } },
          ],
        }
      : {}),
  };

  const [reports, total] = await Promise.all([
    siteDb.report.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        reportedName: true,
        category: true,
        status: true,
        createdAt: true,
        reporter: { select: { id: true, nickname: true, accountLink: { select: { status: true, minecraftUuid: true, minecraftName: true } } } },
      },
    }),
    siteDb.report.count({ where }),
  ]);

  const { resolveSkinUrls } = await import("@/lib/skin");
  const skinUrls = await resolveSkinUrls(reports.map((r) => r.reporter.accountLink?.minecraftUuid));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const dateLocale = lang === "ru" ? "ru-RU" : "en-US";

  const baseQuery = {
    ...(search ? { search } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(rawSort && rawSort in SORTABLE ? { sort: sortKey, order: sortDir } : {}),
    ...(rawPageSize ? { pageSize: String(PAGE_SIZE) } : {}),
  };

  const { getAllOnlinePlayers } = await import("@/lib/players");
  const onlinePlayers = await getAllOnlinePlayers();
  const onlineMcNames = new Set(onlinePlayers.map((p) => p.name.toLowerCase()));

  const reportRows = reports.map((report, i) => ({
    id: report.id,
    reportedName: report.reportedName,
    category: report.category,
    status: report.status,
    createdAtLabel: report.createdAt.toLocaleString(dateLocale),
    reporterNickname: report.reporter.nickname,
    skinUrl: skinUrls[i],
    isLinked: report.reporter.accountLink?.status === "CONFIRMED",
    siteOnline: isUserOnline(report.reporter.id),
    mcOnline: report.reporter.accountLink?.minecraftName ? onlineMcNames.has(report.reporter.accountLink.minecraftName.toLowerCase()) : false,
  }));

  const searchSlot = (
    <form className="w-full max-w-xs">
      <SearchInput name="search" defaultValue={search} placeholder={tr("searchPlaceholder")} />
    </form>
  );

  return (
    <AdminPageShell title={tr("title")} description={tr("description")} active="reports" navAccess={navAccess}>
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={{
                pathname: "/admin/reports",
                query: {
                  ...(search ? { search } : {}),
                  ...(rawSort && rawSort in SORTABLE ? { sort: sortKey, order: sortDir } : {}),
                  ...(rawPageSize ? { pageSize: String(PAGE_SIZE) } : {}),
                  ...(s !== "ALL" ? { status: s } : {}),
                },
              }}
              className={cn(
                "px-3 py-1 rounded-full text-[0.65rem] uppercase tracking-widest border transition-colors",
                status === s
                  ? "border-primary/40 bg-primary/10 text-primary/90"
                  : "border-primary/15 text-foreground/45 hover:text-foreground/70 hover:border-primary/30"
              )}
            >
              {s === "ALL" ? tr("statusAll") : tr(`statuses.${s}`)}
            </Link>
          ))}
        </div>

        <AdminReportsTable reports={reportRows} sortColumn={sortKey} sortDirection={sortDir} rowOffset={(page - 1) * PAGE_SIZE} searchSlot={searchSlot} pageSize={PAGE_SIZE} />

        <div className="mt-6">
          <TablePagination
            page={page}
            totalPages={totalPages}
            pageStart={(page - 1) * PAGE_SIZE}
            pageSize={PAGE_SIZE}
            total={total}
            hrefBase={{ pathname: "/admin/reports", query: baseQuery }}
          />
        </div>
      </div>
    </AdminPageShell>
  );
}

import { getTranslations } from "next-intl/server";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminApplicationsTable } from "@/components/admin/AdminApplicationsTable";
import { isUserOnline } from "@/lib/presence";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { TablePagination } from "@/components/docs/paged-table/TablePagination";
import { resolvePageSize } from "@/lib/pagination";
import type { Prisma, ApplicationStatus } from ".prisma/site-client";

const DEFAULT_PAGE_SIZE = 10;
const STATUS_FILTERS = ["ALL", "OPEN", "IN_REVIEW", "ACCEPTED", "REJECTED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// Allowlist, not a raw column passthrough — searchParams are user input.
const SORTABLE = {
  applicant: "applicantName",
  status: "status",
  created: "createdAt",
} as const satisfies Record<string, keyof Prisma.ApplicationOrderByWithRelationInput>;

export default async function AdminApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string; sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  await requireResourceRole(lang, "applications-view");
  const navAccess = await getAdminNavAccess();
  const { search: rawSearch, status: rawStatus, page: rawPage, pageSize: rawPageSize, sort: rawSort, order: rawOrder } = await searchParams;

  const search = rawSearch?.trim() ?? "";
  const status: StatusFilter = STATUS_FILTERS.includes(rawStatus as StatusFilter) ? (rawStatus as StatusFilter) : "ALL";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const PAGE_SIZE = resolvePageSize(rawPageSize, DEFAULT_PAGE_SIZE);
  const sortDir: "asc" | "desc" = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : "desc";
  const sortKey = (rawSort && rawSort in SORTABLE ? rawSort : "created") as keyof typeof SORTABLE;
  const orderBy: Prisma.ApplicationOrderByWithRelationInput = { [SORTABLE[sortKey]]: sortDir };

  const tr = await getTranslations("Admin.applications");

  const where = {
    ...(status !== "ALL" ? { status: status as ApplicationStatus } : {}),
    ...(search
      ? {
          OR: [
            { applicantName: { contains: search } },
            { applicant: { nickname: { contains: search } } },
          ],
        }
      : {}),
  };

  const [applications, total] = await Promise.all([
    siteDb.application.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        applicantName: true,
        serverId: true,
        status: true,
        createdAt: true,
        applicant: { select: { id: true, nickname: true, accountLink: { select: { status: true, minecraftUuid: true, minecraftName: true } } } },
      },
    }),
    siteDb.application.count({ where }),
  ]);

  const { resolveSkinUrls } = await import("@/lib/skin");
  const skinUrls = await resolveSkinUrls(applications.map((a) => a.applicant.accountLink?.minecraftUuid));

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

  const applicationRows = applications.map((application, i) => ({
    id: application.id,
    applicantName: application.applicantName,
    serverId: application.serverId,
    status: application.status,
    createdAtLabel: application.createdAt.toLocaleString(dateLocale),
    applicantNickname: application.applicant.nickname,
    skinUrl: skinUrls[i],
    isLinked: application.applicant.accountLink?.status === "CONFIRMED",
    siteOnline: isUserOnline(application.applicant.id),
    mcOnline: application.applicant.accountLink?.minecraftName ? onlineMcNames.has(application.applicant.accountLink.minecraftName.toLowerCase()) : false,
  }));

  const searchSlot = (
    <form className="w-full max-w-xs">
      <SearchInput name="search" defaultValue={search} placeholder={tr("searchPlaceholder")} />
    </form>
  );

  return (
    <AdminPageShell title={tr("title")} description={tr("description")} active="applications" navAccess={navAccess}>
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={{
                pathname: "/admin/applications",
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

        <AdminApplicationsTable applications={applicationRows} sortColumn={sortKey} sortDirection={sortDir} rowOffset={(page - 1) * PAGE_SIZE} searchSlot={searchSlot} pageSize={PAGE_SIZE} />

        <div className="mt-6">
          <TablePagination
            page={page}
            totalPages={totalPages}
            pageStart={(page - 1) * PAGE_SIZE}
            pageSize={PAGE_SIZE}
            total={total}
            hrefBase={{ pathname: "/admin/applications", query: baseQuery }}
          />
        </div>
      </div>
    </AdminPageShell>
  );
}

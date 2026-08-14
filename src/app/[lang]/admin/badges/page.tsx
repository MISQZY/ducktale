import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinBadges } from "@/lib/badges";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { BadgeChip } from "@/components/badges/BadgeChip";
import { BadgeFormDialog } from "@/components/admin/BadgeFormDialog";
import { BadgeRowActions } from "@/components/admin/BadgeRowActions";
import { BadgeUsersDialog } from "@/components/admin/BadgeUsersDialog";
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
import { ServerPagination } from "@/components/common/ServerPagination";

const PAGE_SIZE = 10;

export default async function AdminBadgesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { lang } = await params;
  await requireAdmin(lang);
  const { page: rawPage } = await searchParams;

  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  // Idempotent (createMany + skipDuplicates) — cheap enough to run on every
  // load, guarantees the code-defined catalog always shows up here even if
  // this is the very first time anyone's visited this page.
  await seedBuiltinBadges();

  const badgeRows = await siteDb.badge.findMany({
    orderBy: { createdAt: "asc" },
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
    orderBy: { name: "asc" },
    select: { id: true, group: true, name: true },
  });

  const badges = badgeRows.map(({ autoRoles, ...badge }) => ({
    ...badge,
    autoRoleIds: autoRoles.map((ar) => ar.roleId),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const t = await getTranslations("Admin");
  const tb = await getTranslations("Admin.badges");

  return (
    <AdminPageShell title={t("badgesTitle")} description={tb("description", { count: total })} active="badges">
      <div className="w-full">
        <div className="flex justify-center mb-6">
          <BadgeFormDialog
            lang={lang}
            roleOptions={roleOptions}
            trigger={<FormButton className="px-5 py-2 text-xs">{tb("createTitle")}</FormButton>}
          />
        </div>

        <div className="min-h-[42vh]">
          <DocsTable>
            <DocsTableHeader>
              <DocsTableRow>
                <DocsTableHead className="w-[250px] align-middle" withRightBorder>{tb("badgeColumn")}</DocsTableHead>
                <DocsTableHead className="align-middle" withRightBorder>{tb("descriptionColumn")}</DocsTableHead>
                <DocsTableHead className="w-[120px] text-center align-middle" withRightBorder>{tb("awardedColumn")}</DocsTableHead>
                <DocsTableHead className="w-[120px] align-middle text-right">{t("actionsColumn")}</DocsTableHead>
              </DocsTableRow>
            </DocsTableHeader>
            <DocsTableBody className="[&_tr:last-child]:border-0">
              {badges.length === 0 ? (
                <DocsTableRow>
                  <DocsTableCell colSpan={4} className="text-center py-10">
                    <p className={cn("text-sm", DOCS_TABLE_THEME.textFaint)}>{tb("noResults")}</p>
                  </DocsTableCell>
                </DocsTableRow>
              ) : (
                badges.map((badge) => (
                  <DocsTableRow key={badge.id}>
                    <DocsTableCell className="align-middle" withRightBorder>
                      <BadgeChip name={badge.name} icon={badge.icon} color={badge.color} />
                    </DocsTableCell>
                    
                    <DocsTableCell className="align-middle" withRightBorder>
                      <div className="flex flex-col gap-1">
                        {badge.description && (
                          <span className="text-foreground/80 text-xs font-medium">{badge.description}</span>
                        )}
                        {badge.earnCondition && (
                          <span className="text-foreground/45 text-[0.65rem]">{tb("earnConditionPrefix")} {badge.earnCondition}</span>
                        )}
                      </div>
                    </DocsTableCell>

                    <DocsTableCell className="align-middle text-center" withRightBorder>
                      <BadgeUsersDialog
                        lang={lang}
                        badgeId={badge.id}
                        badgeName={badge.name}
                        count={badge._count.userBadges}
                      />
                    </DocsTableCell>

                    <DocsTableCell className="align-middle text-right">
                      <BadgeRowActions lang={lang} badge={badge} roleOptions={roleOptions} />
                    </DocsTableCell>
                  </DocsTableRow>
                ))
              )}
            </DocsTableBody>
          </DocsTable>
        </div>

        <ServerPagination
          page={page}
          totalPages={totalPages}
          pathname="/admin/badges"
          buildQuery={(p) => ({ page: String(p) })}
          prevText={t("prevPage")}
          nextText={t("nextPage")}
        />
      </div>
    </AdminPageShell>
  );
}

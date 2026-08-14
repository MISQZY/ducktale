import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinBadges } from "@/lib/badges";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { BadgeFormDialog } from "@/components/admin/BadgeFormDialog";
import { AdminBadgesTable } from "@/components/admin/AdminBadgesTable";
import { FormButton } from "@/components/common/FormButton";
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
          <AdminBadgesTable lang={lang} badges={badges} roleOptions={roleOptions} />
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

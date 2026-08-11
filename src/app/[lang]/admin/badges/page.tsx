import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinBadges } from "@/lib/badges";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { BadgeChip } from "@/components/badges/BadgeChip";
import { BadgeFormDialog } from "@/components/admin/BadgeFormDialog";
import { BadgeRowActions } from "@/components/admin/BadgeRowActions";
import { FormButton } from "@/components/common/FormButton";

export default async function AdminBadgesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  await requireAdmin(lang);

  // Idempotent (createMany + skipDuplicates) — cheap enough to run on every
  // load, guarantees the code-defined catalog always shows up here even if
  // this is the very first time anyone's visited this page.
  await seedBuiltinBadges();

  const badges = await siteDb.badge.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, description: true, earnCondition: true, icon: true, color: true,
      _count: { select: { userBadges: true } },
    },
  });

  const t = await getTranslations("Admin");
  const tb = await getTranslations("Admin.badges");

  return (
    <AdminPageShell title={t("badgesTitle")} description={tb("description", { count: badges.length })} active="badges">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <BadgeFormDialog
            lang={lang}
            trigger={<FormButton className="px-5 py-2 text-xs">{tb("createTitle")}</FormButton>}
          />
        </div>

        <div className="space-y-4 min-h-[42vh]">
          {badges.length === 0 ? (
            <p className="rounded-2xl border border-primary/20 bg-card/50 p-10 text-center text-foreground/40 text-sm">
              {tb("noResults")}
            </p>
          ) : (
            badges.map((badge) => (
              <div
                key={badge.id}
                className="corner-ornament rounded-2xl border border-primary/20 bg-card/50 p-5 relative overflow-hidden"
              >
                <BadgeChip name={badge.name} icon={badge.icon} color={badge.color} />
                {badge.description && (
                  <p className="text-foreground/60 text-sm mt-2">{badge.description}</p>
                )}
                {badge.earnCondition && (
                  <p className="text-foreground/40 text-xs mt-1">{tb("earnConditionPrefix")} {badge.earnCondition}</p>
                )}
                <p className="text-foreground/35 text-xs mt-1">
                  {tb("holderCount", { count: badge._count.userBadges })}
                </p>

                <div className="mt-4 pt-4 border-t border-primary/10">
                  <BadgeRowActions lang={lang} badge={badge} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}

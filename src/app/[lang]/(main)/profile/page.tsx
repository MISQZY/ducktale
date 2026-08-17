import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { evaluateAutoBadges } from "@/lib/luckperms";
import { hasAdminNavAccess } from "@/lib/admin";
import type { LocalizedName } from "@/lib/i18n-name";
import type { Metadata } from "next";
import { Suspense } from "react";

import { CtaButton } from "@/components/common/CtaButton";
import { ProfileQuickActions } from "@/components/account/ProfileQuickActions";
import { ProfilePlayerCard } from "@/components/account/ProfilePlayerCard";
import { ProfileSectionCard } from "@/components/account/ProfileSectionCard";
import { BadgePinSelector } from "@/components/badges/BadgePinSelector";
import { Callout } from "@/components/docs/Callout";
import { Link as LinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  if (!session?.user?.name) return {};
  const t = await getTranslations("Account.dashboard");
  return { title: t("title", { name: session.user.name }) };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  const t = await getTranslations("Account.dashboard");

  return (
    <>
      <main className="relative overflow-hidden min-h-[calc(100vh-1px)] px-6 pt-20 pb-8">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1
            className="text-3xl text-primary/90 mb-4 leading-tight text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("title", { name: session.user.name ?? "" })}
          </h1>

          <Suspense fallback={
            <div className="flex flex-col gap-4 w-full">
              <Skeleton className="h-[120px] w-full rounded-2xl opacity-50" />
              <Skeleton className="h-[300px] w-full rounded-2xl opacity-50" />
            </div>
          }>
            <ProfileContent lang={lang} session={session} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function ProfileContent({ lang, session }: { lang: string; session: Session }) {
  const t = await getTranslations("Account.dashboard");
  const tp = await getTranslations("Profile");

  // Fetch link and canAccessAdmin in parallel to save time
  const [link, canAccessAdmin] = await Promise.all([
    siteDb.accountLink.findUnique({
      where: { userId: session.user.id },
      select: { status: true, minecraftName: true, minecraftUuid: true },
    }),
    hasAdminNavAccess()
  ]);

  if (link?.status === "CONFIRMED" && link.minecraftUuid) {
    // Fire and forget auto-badges to prevent blocking the profile render
    evaluateAutoBadges(session.user.id, link.minecraftUuid).catch(console.error);
  }

  const user = await siteDb.user.findUnique({
    where: { id: session.user.id },
    select: {
      createdAt: true,
      badges: {
        orderBy: [{ pinned: "desc" }, { awardedAt: "asc" }],
        select: { pinned: true, badge: { select: { id: true, name: true, icon: true, color: true, description: true, earnCondition: true } } },
      },
    },
  });

  const badgesContent = user && user.badges.length > 0 ? (
    <div>
      <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-2 text-center">
        {t("badgesSectionTitle")}
      </h2>
      <BadgePinSelector
        lang={lang}
        badges={user.badges.map(({ badge }) => ({ ...badge, name: badge.name as unknown as LocalizedName }))}
        initialPinnedBadgeId={user.badges.find((b) => b.pinned)?.badge.id ?? null}
      />
    </div>
  ) : undefined;

  return (
    <>
      <div className="mb-1">
        <ProfileQuickActions
          lang={lang}
          publicProfileHref={`/profile/${encodeURIComponent(session.user.name ?? "")}`}
          canAccessAdmin={canAccessAdmin}
          viewProfileLabel={t("viewProfile")}
          adminPanelLabel={t("adminPanel")}
          signOutLabel={t("signOut")}
          isLinked={link?.status === "CONFIRMED"}
          linkHref="/account/link"
          linkLabel={t("linkCta")}
          unlinkLabel={t("unlink")}
        />
      </div>

      {user?.createdAt && (
        <p className="text-center text-xs text-foreground/35 mb-4">
          {tp("memberSince", { date: user.createdAt.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") })}
        </p>
      )}

      {link?.status !== "CONFIRMED" && (
        <Callout variant="warning" className="mb-4">
          <span className="inline-flex items-center gap-1.5">
            {t("linkHint")}
            <LinkIcon size={14} className="inline shrink-0" />
          </span>
        </Callout>
      )}

      {link?.status === "CONFIRMED" && link.minecraftName ? (
        <div className="mb-4">
          <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-3 text-center">
            {t("playerCardTitle")}
          </h2>
          <ProfilePlayerCard
            minecraftName={link.minecraftName}
            locale={lang}
            badgesNode={badgesContent}
          />
        </div>
      ) : (
        badgesContent ? <div className="mb-4">{badgesContent}</div> : null
      )}

      <ProfileSectionCard title={t("supportSectionTitle")} titleClassName="text-center text-sm">
        <p className="text-foreground/45 text-sm mb-5 text-center">{t("supportSectionDescription")}</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <CtaButton href={`/${lang}/account/tickets`} variant="outline">
            {t("myTickets")}
          </CtaButton>
          <CtaButton href={`/${lang}/account/reports`} variant="outline">
            {t("myReports")}
          </CtaButton>
          <CtaButton href={`/${lang}/account/applications`} variant="outline">
            {t("myApplications")}
          </CtaButton>
        </div>
      </ProfileSectionCard>
    </>
  );
}

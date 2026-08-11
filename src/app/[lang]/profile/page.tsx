import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import Navbar from "@/components/Navbar";
import DuckyPet from "@/components/DuckyPet";
import { CtaButton } from "@/components/common/CtaButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProfileQuickActions } from "@/components/account/ProfileQuickActions";
import { ProfilePlayerCard } from "@/components/account/ProfilePlayerCard";
import { ProfileSectionCard } from "@/components/account/ProfileSectionCard";
import { ProfileBadgeChip } from "@/components/badges/ProfileBadgeChip";

/** The signed-in user's own profile — /profile with no username. A username segment (/profile/[username]) is the public view of any user instead, see that route. */
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  const t = await getTranslations("Account.dashboard");
  const tp = await getTranslations("Profile");
  const [link, user] = await Promise.all([
    siteDb.accountLink.findUnique({
      where: { userId: session.user.id },
      select: { status: true, minecraftName: true },
    }),
    // isAdmin isn't selected here — it's already on session.user, which
    // auth()'s session() callback fetched from the DB (and cache() now
    // dedupes across every auth() call in this request, see src/auth.ts).
    siteDb.user.findUnique({
      where: { id: session.user.id },
      select: {
        createdAt: true,
        badges: { select: { badge: { select: { id: true, name: true, icon: true, color: true, description: true, earnCondition: true } } } },
      },
    }),
  ]);

  return (
    <>
      <Navbar />
      {/* Plain page background on purpose — no PageBackground here (that's
          the hero-style stonework/blur-orb layer sized for full sections;
          on this shorter page its absolutely-positioned orbs overflowed the
          viewport and produced scrollbars). Just the body's own base fill,
          relative+overflow-hidden only so DuckyPet has somewhere to wander. */}
      <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-16">
        <DuckyPet />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h1
            className="text-3xl text-primary/90 mb-4 leading-tight text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("title")}
          </h1>

          <div className="mb-8">
            <ProfileQuickActions
              lang={lang}
              publicProfileHref={`/profile/${encodeURIComponent(session.user.name ?? "")}`}
              isAdmin={session.user.isAdmin}
              viewProfileLabel={t("viewProfile")}
              adminPanelLabel={t("adminPanel")}
              signOutLabel={t("signOut")}
            />
          </div>

          {user && user.badges.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-2 text-center">
                {t("badgesSectionTitle")}
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {user.badges.map(({ badge }) => (
                  <ProfileBadgeChip
                    key={badge.id}
                    name={badge.name}
                    icon={badge.icon}
                    color={badge.color}
                    description={badge.description}
                    earnCondition={badge.earnCondition}
                  />
                ))}
              </div>
            </div>
          )}

          {link?.status === "CONFIRMED" && link.minecraftName ? (
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-3 text-center">
                {t("playerCardTitle")}
              </h2>
              <ProfilePlayerCard
                minecraftName={link.minecraftName}
                locale={lang}
                manage={{ lang }}
                registeredLabel={
                  user?.createdAt
                    ? tp("memberSince", { date: user.createdAt.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") })
                    : undefined
                }
              />
            </div>
          ) : (
            <ProfileSectionCard title={t("linkSectionTitle")}>
              <div className="mb-5">
                {link?.status === "PENDING" ? (
                  <StatusBadge label={t("pending")} pulse />
                ) : (
                  <p className="text-foreground/45 text-sm">{t("notLinked")}</p>
                )}
              </div>

              <CtaButton href={`/${lang}/account/link`} variant="primary">
                {t("linkCta")}
              </CtaButton>
            </ProfileSectionCard>
          )}

          <ProfileSectionCard title={t("supportSectionTitle")}>
            <p className="text-foreground/45 text-sm mb-5">{t("supportSectionDescription")}</p>
            <CtaButton href={`/${lang}/account/tickets`} variant="outline">
              {t("myTickets")}
            </CtaButton>
          </ProfileSectionCard>
        </div>
      </main>
    </>
  );
}

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { evaluateAutoBadges } from "@/lib/luckperms";
import Navbar from "@/components/Navbar";

import { CtaButton } from "@/components/common/CtaButton";
import { ProfileQuickActions } from "@/components/account/ProfileQuickActions";
import { ProfilePlayerCard } from "@/components/account/ProfilePlayerCard";
import { ProfileSectionCard } from "@/components/account/ProfileSectionCard";
import { BadgePinSelector } from "@/components/badges/BadgePinSelector";
import { Callout } from "@/components/docs/Callout";
import { Link2 } from "lucide-react";

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

  const link = await siteDb.accountLink.findUnique({
    where: { userId: session.user.id },
    select: { status: true, minecraftName: true, minecraftUuid: true },
  });

  // Lazy auto-grant check — no cron/worker in this codebase, so this is the
  // one place a linked account's LuckPerms roles get checked against
  // auto-condition badges (src/lib/luckperms.ts). Awaited before reading
  // `badges` below so a newly-earned one shows up on this same page load.
  if (link?.status === "CONFIRMED" && link.minecraftUuid) {
    await evaluateAutoBadges(session.user.id, link.minecraftUuid);
  }

  // isAdmin isn't selected here — it's already on session.user, which
  // auth()'s session() callback fetched from the DB (and cache() now
  // dedupes across every auth() call in this request, see src/auth.ts).
  const user = await siteDb.user.findUnique({
    where: { id: session.user.id },
    select: {
      createdAt: true,
      // pinned first (there's at most one today), then earliest-awarded —
      // badges[0] is BadgePinSelector's implicit default when nothing's
      // explicitly pinned.
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
        badges={user.badges.map(({ badge }) => badge)}
        initialPinnedBadgeId={user.badges.find((b) => b.pinned)?.badge.id ?? null}
      />
    </div>
  ) : undefined;

  return (
    <>
      <Navbar />
      {/* Plain page background on purpose — no PageBackground here (that's
          the hero-style stonework/blur-orb layer sized for full sections;
          on this shorter page its absolutely-positioned orbs overflowed the
          viewport and produced scrollbars). Just the body's own base fill,
          relative+overflow-hidden only so DuckyPet has somewhere to wander. */}
      <main className="relative overflow-hidden min-h-[calc(100vh-1px)] px-6 pt-20 pb-8">


        <div className="relative z-10 max-w-2xl mx-auto">
          <h1
            className="text-3xl text-primary/90 mb-4 leading-tight text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("title", { name: session.user.name ?? "" })}
          </h1>

          <div className="mb-1">
            <ProfileQuickActions
              lang={lang}
              publicProfileHref={`/profile/${encodeURIComponent(session.user.name ?? "")}`}
              isAdmin={session.user.isAdmin}
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
                <Link2 size={14} className="inline shrink-0" />
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

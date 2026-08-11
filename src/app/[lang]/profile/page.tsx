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
  const [link, user] = await Promise.all([
    siteDb.accountLink.findUnique({
      where: { userId: session.user.id },
      select: { status: true, minecraftName: true },
    }),
    siteDb.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
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
              isAdmin={user?.isAdmin ?? false}
              viewProfileLabel={t("viewProfile")}
              adminPanelLabel={t("adminPanel")}
              signOutLabel={t("signOut")}
            />
          </div>

          {link?.status === "CONFIRMED" && link.minecraftName ? (
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-3 text-center">
                {t("playerCardTitle")}
              </h2>
              <ProfilePlayerCard minecraftName={link.minecraftName} manage={{ lang }} />
            </div>
          ) : (
            <div className="corner-ornament rounded-2xl border border-primary/20 bg-card/50 p-6 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />
              <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-4">
                {t("linkSectionTitle")}
              </h2>

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
            </div>
          )}

          <div className="corner-ornament rounded-2xl border border-primary/20 bg-card/50 p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />
            <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-4">
              {t("supportSectionTitle")}
            </h2>
            <p className="text-foreground/45 text-sm mb-5">{t("supportSectionDescription")}</p>
            <CtaButton href={`/${lang}/account/tickets`} variant="outline">
              {t("myTickets")}
            </CtaButton>
          </div>
        </div>
      </main>
    </>
  );
}

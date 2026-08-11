import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { unlinkAccount } from "@/lib/actions/account-link";
import Navbar from "@/components/Navbar";
import DuckyPet from "@/components/DuckyPet";
import { GoldDivider } from "@/components/common/GoldDivider";
import { CtaButton } from "@/components/common/CtaButton";
import { FormButton } from "@/components/common/FormButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SignOutButton } from "@/components/account/SignOutButton";
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
            className="text-3xl text-primary/90 mb-2 leading-tight"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("title")}
          </h1>
          <p className="text-foreground/60 mb-6">{t("welcome", { nickname: session.user.name ?? "" })}</p>

          <GoldDivider className="mb-8" />

          <div className="corner-ornament rounded-2xl border border-primary/20 bg-card/50 p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />
            <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-4">
              {t("linkSectionTitle")}
            </h2>

            <div className="mb-5">
              {link?.status === "CONFIRMED" ? (
                <StatusBadge label={t("linkedAs", { name: link.minecraftName ?? "" })} />
              ) : link?.status === "PENDING" ? (
                <StatusBadge label={t("pending")} pulse />
              ) : (
                <p className="text-foreground/45 text-sm">{t("notLinked")}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CtaButton
                href={`/${lang}/account/link`}
                variant={link?.status === "CONFIRMED" ? "outline" : "primary"}
              >
                {link?.status === "CONFIRMED" ? t("relink") : t("linkCta")}
              </CtaButton>

              {link?.status === "CONFIRMED" && (
                <form action={unlinkAccount.bind(null, lang)}>
                  <FormButton type="submit" variant="destructive" className="px-5 py-2 text-xs">
                    {t("unlink")}
                  </FormButton>
                </form>
              )}
            </div>
          </div>

          {link?.status === "CONFIRMED" && link.minecraftName && (
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-3">
                {t("playerCardTitle")}
              </h2>
              <ProfilePlayerCard minecraftName={link.minecraftName} />
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

          <div className="flex flex-wrap items-center gap-3">
            <CtaButton href={`/${lang}/profile/${encodeURIComponent(session.user.name ?? "")}`} variant="outline">
              {t("viewProfile")}
            </CtaButton>
            {user?.isAdmin && (
              <CtaButton href={`/${lang}/admin`} variant="outline">
                {t("adminPanel")}
              </CtaButton>
            )}
            <SignOutButton label={t("signOut")} lang={lang} />
          </div>
        </div>
      </main>
    </>
  );
}

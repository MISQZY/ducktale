import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { siteDb } from "@/lib/site-db";
import Navbar from "@/components/Navbar";
import { ProfilePlayerCard } from "@/components/account/ProfilePlayerCard";
import { ProfileBadgeChip } from "@/components/badges/ProfileBadgeChip";
import type { Metadata } from "next";

interface Params {
  lang: string;
  username: string;
}

// Both the page component and generateMetadata() call this — cache() dedupes
// them to a single query per request instead of one each.
const findUser = cache(async (username: string) => {
  return siteDb.user.findUnique({
    where: { nickname: username },
    select: {
      createdAt: true,
      accountLink: { select: { status: true, minecraftName: true } },
      badges: { select: { badge: { select: { id: true, name: true, icon: true, color: true, description: true, earnCondition: true } } } },
    },
  });
});

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { lang, username } = await params;
  const user = await findUser(username);
  if (!user) notFound();

  const t = await getTranslations("Profile");
  const td = await getTranslations("Account.dashboard");

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-16">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1
            className="text-3xl text-primary/90 mb-8 leading-tight text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("pageTitle")}
          </h1>

          {user.badges.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-2 text-center">
                {td("badgesSectionTitle")}
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

          {user.accountLink?.status === "CONFIRMED" && user.accountLink.minecraftName ? (
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-3 text-center">
                {td("playerCardTitle")}
              </h2>
              <ProfilePlayerCard
                minecraftName={user.accountLink.minecraftName}
                locale={lang}
                registeredLabel={t("memberSince", { date: user.createdAt.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") })}
              />
            </div>
          ) : (
            <p className="text-foreground/45 text-sm">{t("notLinked")}</p>
          )}
        </div>
      </main>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await findUser(username);
  if (!user) return {};

  const t = await getTranslations("Profile");
  return {
    title: t("pageTitle"),
  };
}

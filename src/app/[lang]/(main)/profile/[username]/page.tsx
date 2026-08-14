import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { siteDb } from "@/lib/site-db";
import { isUserOnline } from "@/lib/presence";
import { formatLastSeen } from "@/lib/player-card-format";
import { ProfilePlayerCard } from "@/components/account/ProfilePlayerCard";
import { BadgePinSelector } from "@/components/badges/BadgePinSelector";
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
      id: true,
      createdAt: true,
      lastSeenAt: true,
      accountLink: { select: { status: true, minecraftName: true } },
      // pinned first (there's at most one today), then earliest-awarded —
      // matches /api/leaderboard's ordering so the badge shown here as
      // "pinned" is exactly the one shown on the leaderboard.
      badges: {
        orderBy: [{ pinned: "desc" }, { awardedAt: "asc" }],
        select: { pinned: true, badge: { select: { id: true, name: true, icon: true, color: true, description: true, earnCondition: true } } },
      },
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
  const tc = await getTranslations("PlayerCard");

  // Site-only presence (Minecraft-server online is already shown inside
  // ProfilePlayerCard's own "Last login" row, no need to repeat it here).
  // A free in-memory check — see src/lib/presence.ts.
  const siteOnline = isUserOnline(user.id);
  const siteLastSeenMs = user.lastSeenAt?.getTime() ?? null;
  const memberSince = t("memberSince", { date: user.createdAt.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") });

  const badgesContent = user.badges.length > 0 ? (
    <div>
      <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-2 text-center">
        {td("badgesSectionTitle")}
      </h2>
      <BadgePinSelector
        readOnly
        badges={user.badges.map(({ badge }) => badge)}
        initialPinnedBadgeId={user.badges.find((b) => b.pinned)?.badge.id ?? null}
      />
    </div>
  ) : undefined;

  return (
    <>
      <main className="relative overflow-hidden min-h-[calc(100vh-1px)] px-6 pt-20 pb-8">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1
            className="text-3xl text-primary/90 mb-5 leading-tight text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("pageTitle", { name: username })}
          </h1>

          <div className="flex flex-col items-center gap-1 mb-4">
            {siteOnline ? (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                {tc("siteOnline")}
              </span>
            ) : siteLastSeenMs ? (
              <span className="text-xs text-foreground/40">
                {tc("lastSeenOnSite", { date: formatLastSeen(siteLastSeenMs, lang) })}
              </span>
            ) : null}

            <span className="text-xs text-foreground/35">{memberSince}</span>
          </div>

          {user.accountLink?.status === "CONFIRMED" && user.accountLink.minecraftName ? (
            <div className="mb-4">
              <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-3 text-center">
                {td("playerCardTitle")}
              </h2>
              <ProfilePlayerCard
                minecraftName={user.accountLink.minecraftName}
                locale={lang}
                badgesNode={badgesContent}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <p className="text-foreground/45 text-sm mb-4 text-center">{t("notLinked")}</p>
              {badgesContent}
            </div>
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
    title: t("pageTitle", { name: username }),
  };
}

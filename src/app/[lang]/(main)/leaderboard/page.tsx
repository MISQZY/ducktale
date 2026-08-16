import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { GoldDivider } from "@/components/common/GoldDivider";
import { RankingsTabs } from "@/components/leaderboard/RankingsTabs";
import { requirePublicResourceRole } from "@/lib/public-access";
import { getLeaderboardPlayersPage } from "@/lib/leaderboard-data";

// Matches TopPlayersTable's own default pageSize prop — has to agree so the
// cache key this prefetch writes is the one the client's own first fetch
// (if the URL doesn't ask for something else) reads back instead of missing.
const PLAYERS_TAB_PAGE_SIZE = 10;

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  await requirePublicResourceRole(lang, "leaderboard-view");
  const t = await getTranslations("Leaderboard");

  // RankingsTabs always mounts the "players" tab first (see its own doc
  // comment) — prefetching here means the very first paint already has
  // rows instead of a loading skeleton followed by a client-side fetch.
  const initialPlayersData = await getLeaderboardPlayersPage(1, PLAYERS_TAB_PAGE_SIZE, "", "", "");

  return (
    <>
      <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-6">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1
            className="text-3xl text-primary/90 mb-2 leading-tight text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("pageTitle")}
          </h1>
          <p className="text-foreground/60 mb-6 text-center">{t("pageDescription")}</p>

          <GoldDivider className="mb-8" />

          <RankingsTabs initialPlayersData={initialPlayersData} />
        </div>
      </main>
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Leaderboard");
  return { title: t("pageTitle") };
}

import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { GoldDivider } from "@/components/common/GoldDivider";
import { RankingsTabs } from "@/components/leaderboard/RankingsTabs";

export default async function LeaderboardPage() {
  const t = await getTranslations("Leaderboard");

  return (
    <>
      <Navbar />
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

          <RankingsTabs />
        </div>
      </main>
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Leaderboard");
  return { title: t("pageTitle") };
}

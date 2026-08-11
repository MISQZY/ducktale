import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { siteDb } from "@/lib/site-db";
import Navbar from "@/components/Navbar";
import { GoldDivider } from "@/components/common/GoldDivider";
import { ProfilePlayerCard } from "@/components/account/ProfilePlayerCard";
import type { Metadata } from "next";

interface Params {
  lang: string;
  username: string;
}

async function findUser(username: string) {
  return siteDb.user.findUnique({
    where: { nickname: username },
    select: {
      nickname: true,
      createdAt: true,
      accountLink: { select: { status: true, minecraftName: true } },
    },
  });
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { lang, username } = await params;
  const user = await findUser(username);
  if (!user) notFound();

  const t = await getTranslations("Profile");

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-16">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1
            className="text-3xl text-primary/90 mb-2 leading-tight"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {user.nickname}
          </h1>
          <p className="text-foreground/60 mb-6">
            {t("memberSince", { date: user.createdAt.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US") })}
          </p>

          <GoldDivider className="mb-8" />

          {user.accountLink?.status === "CONFIRMED" && user.accountLink.minecraftName ? (
            <ProfilePlayerCard minecraftName={user.accountLink.minecraftName} />
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

  return {
    title: user.nickname,
  };
}

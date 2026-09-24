import { getTranslations } from "next-intl/server";
import { NewThreadForm } from "@/components/threads/NewThreadForm";
import { PanelCenteredShell } from "@/components/common/PanelCenteredShell";
import { siteDb } from "@/lib/site-db";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Threads");
  return { title: t("newThreadTitle") };
}

export default async function NewThreadPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getTranslations("Threads");

  const sections = await siteDb.threadSection.findMany({ select: { id: true, name: true } });

  return (
    <PanelCenteredShell title={t("newThreadTitle")} description={t("newThreadDescription")}>
      <NewThreadForm
        lang={lang}
        sections={sections
          .map((s) => ({ id: s.id, name: localizedName(s.name as unknown as LocalizedName, lang) }))
          .sort((a, b) => a.name.localeCompare(b.name, lang === "ru" ? "ru" : "en"))}
      />
    </PanelCenteredShell>
  );
}

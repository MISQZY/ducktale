import { getTranslations } from "next-intl/server";
import { NewThreadForm } from "@/components/threads/NewThreadForm";
import { PanelCenteredShell } from "@/components/common/PanelCenteredShell";
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

  return (
    <PanelCenteredShell title={t("newThreadTitle")} description={t("newThreadDescription")}>
      <NewThreadForm lang={lang} />
    </PanelCenteredShell>
  );
}

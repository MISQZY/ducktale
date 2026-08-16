import { getTranslations } from "next-intl/server";
import { NewThreadForm } from "@/components/threads/NewThreadForm";
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
    <div className="w-full h-full flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
      <div className="max-w-lg w-full mx-auto py-2">
        <h1 className="text-2xl text-primary/90 leading-tight mb-1" style={{ fontFamily: "var(--font-body)" }}>
          {t("newThreadTitle")}
        </h1>
        <p className="text-foreground/60 text-sm mb-6">{t("newThreadDescription")}</p>
        <NewThreadForm lang={lang} />
      </div>
    </div>
  );
}

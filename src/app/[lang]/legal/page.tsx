import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import { GoldDivider } from "@/components/common/GoldDivider";
import { SITE } from "@/config/site";

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export default async function LegalPage() {
  const t = await getTranslations("Legal");
  const sections = t.raw("sections") as LegalSection[];

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden min-h-screen px-6 pt-24 pb-16">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1
            className="text-3xl text-primary/90 mb-2 leading-tight"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("title")}
          </h1>
          <p className="text-foreground/60 mb-1">{t("subtitle")}</p>
          <p className="text-foreground/35 text-xs uppercase tracking-widest mb-6">
            {t("lastUpdated")}
          </p>

          <GoldDivider className="mb-8" />

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg text-primary/85 mb-3" style={{ fontFamily: "var(--font-body)" }}>
                  {section.heading}
                </h2>
                <div className="space-y-3">
                  {section.paragraphs.map((paragraph, i) => (
                    <p key={i} className="text-foreground/65 text-sm leading-relaxed">
                      {paragraph.replaceAll("{siteUrl}", SITE.url)}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

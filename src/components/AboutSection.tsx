import { Shield, Users, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import SectionHeader from "@/components/SectionHeader";
import { FEATURE_KEYS, SITE } from "@/config/site";

// Icons are wired here — adding a feature just means adding to FEATURE_KEYS in config
const FEATURE_ICONS: Record<string, LucideIcon> = {
  history: Clock,
  protection: Shield,
  community: Users,
};

export default function AboutSection() {
  const t = useTranslations("About");
  const features = FEATURE_KEYS.map((key) => ({
    key,
    icon: FEATURE_ICONS[key],
    title: t(`features.${key}.title`),
    desc: t(`features.${key}.desc`),
  }));

  return (
    <section id="about" className="py-16 px-6 relative">
      {/* Decorative side text */}
      <div
        className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 text-primary/20 text-xs"
        style={{
          fontFamily: "var(--font-display)",
          writingMode: "vertical-rl",
        }}
      >
        ✦ DUCKTALE ✦
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <SectionHeader
          label={t("label")}
          title={t("title")}
          description={t("description", { year: SITE.foundedYear })}
        />

        <div className="flex flex-wrap justify-center flex-row gap-5">
          {features.map(({ key, icon: Icon, title, desc }) => (
            <div
              key={key}
              className="liquid-card w-full sm:w-[calc(33%-15px)] rounded-xl border border-primary/20 bg-muted/40 p-7 hover:border-primary/35 transition-all duration-300 group hover:bg-muted/60"
            >
              <div className="absolute inset-0 pointer-events-none rounded-xl">
                <div className="corner-ornament w-full h-full" />
              </div>
              <div className="relative z-20">
                <div className="w-11 h-11 rounded-lg bg-primary/8 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/14 group-hover:border-primary/35 transition-all duration-300">
                  <Icon size={19} className="text-primary/80" />
                </div>
                <h3
                  className="text-foreground/90 font-semibold mb-2.5 text-sm tracking-wider"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {title}
                </h3>
                <p className="text-foreground/45 text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Shield, Users, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import SectionHeader from "@/components/SectionHeader";
import { FEATURE_KEYS, STAT_KEYS, SITE } from "@/config/site";

// Icons are wired here — adding a feature just means adding to FEATURE_KEYS in config
const FEATURE_ICONS: Record<string, LucideIcon> = { protection: Shield, community: Users };
const STAT_ICONS: Record<string, LucideIcon> = { years: Flame, visitors: Users };

export default function AboutSection() {
  const t = useTranslations("About");
  const features = FEATURE_KEYS.map((key) => ({
    key,
    icon: FEATURE_ICONS[key],
    title: t(`features.${key}.title`),
    desc: t(`features.${key}.desc`),
  }));
  const stats = STAT_KEYS.map((key) => ({
    key,
    icon: STAT_ICONS[key],
    n: t(`stats.${key}.n`),
    label: t(`stats.${key}.label`),
  }));

  return (
    <section id="about" className="py-28 px-6 relative">
      {/* Decorative side text */}
      <div
        className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 text-primary/20 text-xs"
        style={{ fontFamily: "var(--font-display)", writingMode: "vertical-rl" }}
      >
        ✦ DUCKTALE ✦
      </div>

      <div className="max-w-5xl mx-auto">
        <SectionHeader
          label={t("label")}
          title={t("title")}
          description={t("description", { year: SITE.foundedYear })}
        />

        <div className="flex flex-wrap justify-center flex-row gap-5">
          {features.map(({ key, icon: Icon, title, desc }) => (
            <div
              key={key}
              className="corner-ornament w-full sm:w-[calc(50%-10px)] rounded-xl border border-primary/20 bg-muted/40 p-7 hover:border-primary/35 transition-all duration-300 group hover:bg-muted/60"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/8 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/14 group-hover:border-primary/35 transition-all duration-300">
                <Icon size={19} className="text-primary/80" />
              </div>
              <h3
                className="text-foreground/90 font-semibold mb-2.5 text-sm tracking-wider"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {title}
              </h3>
              <p className="text-foreground/45 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-8 grid grid-cols-2 divide-x divide-gold-800/25 rounded-2xl border border-primary/20 bg-card/50 overflow-hidden relative">
          <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />

          {stats.map(({ key, n, label, icon: Icon }) => (
            <div key={key} className="py-9 text-center group">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Icon size={14} className="text-primary/50 group-hover:text-primary/70 transition-colors" />
                <div
                  className="text-4xl text-primary font-bold"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {n}
                </div>
              </div>
              <div className="text-foreground/35 text-xs tracking-widest uppercase mt-1">{label}</div>
            </div>
          ))}

          <div className="absolute bottom-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ChevronDown, Sword } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageBackground } from "@/components/common/PageBackground";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CtaButton } from "@/components/common/CtaButton";
import { SITE } from "@/config/site";
import DuckyPet from "@/components/DuckyPet";

export default function HeroSection() {
  const t = useTranslations("Hero");

  const CTA_LINKS = [
    { href: "/#servers", label: t("ctaPrimary"), variant: "primary" as const },
    { href: "/#about",   label: t("ctaSecondary"), variant: "outline" as const },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-16">
      <PageBackground />
      <DuckyPet />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge row */}
        <div className="flex items-center justify-center gap-3 mb-8 fade-up">
          <div className="h-px w-16 bg-linear-to-r from-transparent to-primary/60" />
          <StatusBadge label={t("badge")} pulse />
          <div className="h-px w-16 bg-linear-to-l from-transparent to-primary/60" />
        </div>

        {/* Heading */}
        <h1
          className="text-7xl md:text-9xl mb-4 leading-none fade-up fade-up-1"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          <span className="px-4 shimmer-gold drop-shadow-[0_0_40px_rgba(212,160,23,0.3)]">
            {SITE.name}
          </span>
        </h1>

        <p
          className="text-primary/70 text-sm tracking-[0.35em] uppercase mb-6 fade-up fade-up-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ✦ {t("tagline")} ✦
        </p>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mb-8 fade-up fade-up-2">
          <div className="h-px flex-1 max-w-24 bg-linear-to-r from-transparent via-primary/50 to-primary/50" />
          <Sword size={14} className="text-primary/50 rotate-45" />
          <div className="h-px flex-1 max-w-24 bg-linear-to-l from-transparent via-primary/50 to-primary/50" />
        </div>

        {/* Description */}
        <p
          className="text-foreground/70 max-w-xl mx-auto leading-relaxed mb-12 text-lg fade-up fade-up-3"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t.rich("description", {
            siteName: SITE.name,
            duckburg: (chunks) => (
              <Link
                href="/docs/duckburg"
                className="text-emerald-600 dark:text-emerald-400/80 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors font-semibold border-b border-emerald-500/20 hover:border-emerald-400/40"
              >
                {chunks}
              </Link>
            ),
            duckhood: (chunks) => (
              <Link
                href="/docs/duckhood"
                className="text-sky-600 dark:text-sky-400/80 hover:text-sky-500 dark:hover:text-sky-300 transition-colors font-semibold border-b border-sky-500/20 hover:border-sky-400/40"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 fade-up fade-up-4">
          {CTA_LINKS.map(({ href, label, variant }) => (
            <CtaButton key={href} href={href} variant={variant}>
              {label}
            </CtaButton>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center text-primary/40 animate-bounce">
          <ChevronDown size={22} />
        </div>
      </div>
    </section>
  );
}

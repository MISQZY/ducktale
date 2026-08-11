import { useTranslations } from "next-intl";
import Logo from "@/components/ui/Logo";
import { Link } from "@/i18n/navigation";
import { SITE } from "@/config/site";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="relative border-t border-primary/20 py-14 px-6 text-center overflow-hidden">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-5">
          <Logo />
        </div>

        <div className="flex items-center justify-center gap-3 mb-5 text-primary/30 text-xs">
          <div className="h-px w-12 bg-linear-to-r from-transparent to-primary/30" />
          <span>✦</span>
          <div className="h-px w-12 bg-linear-to-l from-transparent to-primary/30" />
        </div>

        <p className="text-foreground/20 text-xs tracking-wide leading-relaxed">
          {t("existsSince", { year: SITE.foundedYear })}&nbsp;{t("legalNotice")}
        </p>

        <Link
          href="/legal"
          className="inline-block mt-3 text-foreground/25 hover:text-primary/60 text-xs tracking-wide underline decoration-dotted underline-offset-4 transition-colors"
        >
          {t("legalLink")}
        </Link>
      </div>
    </footer>
  );
}

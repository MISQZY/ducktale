import Logo from "@/components/ui/Logo";
import { SITE } from "@/config/site";

export default function Footer() {
  return (
    <footer className="relative border-t border-gold-800/20 py-14 px-6 text-center overflow-hidden">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-gold-600/25 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center mb-5">
          <Logo />
        </div>

        <div className="flex items-center justify-center gap-3 mb-5 text-gold-700/30 text-xs">
          <div className="h-px w-12 bg-linear-to-r from-transparent to-gold-600/30" />
          <span>✦</span>
          <div className="h-px w-12 bg-linear-to-l from-transparent to-gold-600/30" />
        </div>

        <p className="text-amber-100/20 text-xs tracking-wide leading-relaxed">
          Существует с {SITE.foundedYear} года.&nbsp;{SITE.legalNotice}
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Home, ArrowRight, Sword } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { PageBackground } from "./PageBackground";
import { GoldDivider } from "./GoldDivider";
import { StatusBadge } from "./StatusBadge";
import { CtaButton } from "./CtaButton";
import type { ReactNode } from "react";

interface NotFoundServerLink {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  href: string;
}

interface NotFoundViewProps {
  badge: string;
  heading: string;
  description: string;
  ctaHomeLabel: string;
  ctaServersLabel: string;
  docsHint: string;
  homeHref: string;
  serversHref: string;
  servers: NotFoundServerLink[];
  /** Extra content rendered below the logo, e.g. a locale switcher when no NavBar is available. */
  footer?: ReactNode;
}

/**
 * Shared visual for every "page not found" boundary in the app: the themed
 * app/[lang]/not-found.tsx (has i18n + Navbar context) and the context-free
 * app/global-not-found.tsx (catches unmatched URLs before any layout renders).
 * Kept string- and href-driven so it never depends on next-intl's React context.
 */
export function NotFoundView({
  badge,
  heading,
  description,
  ctaHomeLabel,
  ctaServersLabel,
  docsHint,
  homeHref,
  serversHref,
  servers,
  footer,
}: NotFoundViewProps) {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-16">
      <PageBackground />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <StatusBadge label={badge} className="mb-8" />

        <div
          className="text-8xl md:text-9xl leading-none font-bold mb-2 select-none"
          style={{
            fontFamily: "var(--font-display)",
            background:
              "linear-gradient(180deg, rgba(212,160,23,0.25) 0%, rgba(212,160,23,0.08) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          aria-hidden="true"
        >
          404
        </div>

        <h1
          className="text-3xl md:text-5xl text-primary/90 mb-5 leading-tight"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {heading}
        </h1>

        <GoldDivider wide className="mb-6" />

        <p className="text-foreground/45 leading-relaxed mb-10 max-w-sm mx-auto">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <CtaButton href={homeHref} variant="primary" icon={<Home size={15} />}>
            {ctaHomeLabel}
          </CtaButton>
          <CtaButton href={serversHref} variant="outline">
            {ctaServersLabel}
          </CtaButton>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-card/50 overflow-hidden relative">
          <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
          <div className="flex items-center justify-center gap-2 px-6 pt-5 pb-3">
            <Sword size={11} className="text-primary/40 rotate-45" />
            <p className="text-foreground/30 text-xs tracking-[0.35em] uppercase">
              {docsHint}
            </p>
            <Sword size={11} className="text-primary/40 -rotate-135" />
          </div>
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gold-900/25">
            {servers.map((server) => (
              <Link
                key={server.id}
                href={server.href}
                className="flex items-center justify-between px-6 py-4 hover:bg-primary/4 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg bg-muted border border-border/60 flex items-center justify-center text-lg
                                    group-hover:scale-105 transition-transform"
                  >
                    {server.emoji}
                  </div>
                  <div className="text-left">
                    <div
                      className="text-foreground/80 text-sm font-medium"
                      style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem" }}
                    >
                      {server.name}
                    </div>
                    <div className="text-foreground/30 text-xs">{server.tagline}</div>
                  </div>
                </div>
                <ArrowRight
                  size={13}
                  className="text-primary/40 group-hover:text-primary/70 group-hover:translate-x-1 transition-all"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4">
        <Logo />
        {footer}
      </div>
    </main>
  );
}

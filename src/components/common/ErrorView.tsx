import { Home } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { PageBackground } from "./PageBackground";
import { GoldDivider } from "./GoldDivider";
import { StatusBadge } from "./StatusBadge";
import { CtaButton } from "./CtaButton";
import type { ReactNode } from "react";

export interface ErrorViewProps {
  code: string | number;
  badge: string;
  heading: string;
  description: string;
  ctaHomeLabel: string;
  homeHref: string;
  /** Extra content rendered below the logo, e.g. a locale switcher when no NavBar is available. */
  footer?: ReactNode;
}

export function ErrorView({
  code,
  badge,
  heading,
  description,
  ctaHomeLabel,
  homeHref,
  footer,
}: ErrorViewProps) {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-16">
      <PageBackground />

      <div className="relative z-10 text-center max-w-2xl mx-auto flex flex-col items-center">
        <StatusBadge label={badge} className="mb-6" />

        <div
          className="text-9xl md:text-[12rem] leading-none font-bold mb-4 select-none drop-shadow-xl tracking-tight"
          style={{
            fontFamily: "var(--font-display)",
            background:
              "linear-gradient(180deg, rgba(212,160,23,0.8) 0%, rgba(212,160,23,0.2) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          aria-hidden="true"
        >
          {code}
        </div>

        <h1
          className="text-4xl md:text-5xl text-primary/90 mb-5 leading-tight font-medium drop-shadow-sm"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {heading}
        </h1>

        <GoldDivider wide className="mb-8" />

        <p className="text-foreground/70 text-lg leading-relaxed mb-10 max-w-md mx-auto">
          {description}
        </p>

        <div className="flex justify-center">
          <CtaButton href={homeHref} variant="primary" icon={<Home size={16} />} className="text-base px-6 py-3" hardLink>
            {ctaHomeLabel}
          </CtaButton>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4">
        <Logo />
        {footer}
      </div>
    </main>
  );
}

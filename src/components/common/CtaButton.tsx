"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ctaButtonClasses, CtaShine, CTA_FONT_STYLE, type CtaVariant } from "./cta-button-styles";

interface CtaButtonProps {
  /** Pass an already locale-prefixed path (e.g. `/${locale}#servers`) — this
   * uses plain next/link, not next-intl's Link, because it's also rendered
   * from app/global-not-found.tsx, which has no NextIntlClientProvider for
   * next-intl's Link to read the current locale from. */
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  className?: string;
  icon?: ReactNode;
}

export function CtaButton({
  href,
  children,
  variant = "primary",
  className,
  icon,
}: CtaButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.includes("#")) {
      const id = href.split("#")[1];
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={ctaButtonClasses(variant, className)}
      style={CTA_FONT_STYLE}
    >
      <CtaShine variant={variant} />
      {icon}
      {children}
    </Link>
  );
}

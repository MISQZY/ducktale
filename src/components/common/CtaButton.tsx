"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ctaButtonClasses, CtaShine, CTA_FONT_STYLE, type CtaVariant } from "./cta-button-styles";

interface CtaButtonProps {
  /** Pass an already locale-prefixed path (e.g. `/${locale}#servers`) */
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  className?: string;
  icon?: ReactNode;
  hardLink?: boolean;
}

export function CtaButton({
  href,
  children,
  variant = "primary",
  className,
  icon,
  hardLink,
}: CtaButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.includes("#") && !hardLink) {
      const id = href.split("#")[1];
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const content = (
    <>
      <CtaShine variant={variant} />
      {icon}
      {children}
    </>
  );

  return (
    <Button
      variant="ghost"
      className={`pointer-events-auto ${ctaButtonClasses(variant, className)}`}
      style={{ ...CTA_FONT_STYLE, ...(variant === "outline" ? { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", backgroundColor: "rgba(255, 255, 255, 0.05)" } : {}) }}
      asChild
    >
      {hardLink ? (
        <a href={href}>{content}</a>
      ) : (
        <Link href={href} onClick={handleClick}>
          {content}
        </Link>
      )}
    </Button>
  );
}

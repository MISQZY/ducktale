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
    <Button
      variant="ghost"
      className={ctaButtonClasses(variant, className)}
      style={CTA_FONT_STYLE}
      asChild
    >
      <Link href={href} onClick={handleClick}>
        <CtaShine variant={variant} />
        {icon}
        {children}
      </Link>
    </Button>
  );
}

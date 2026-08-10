"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CtaButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline";
  className?: string;
  icon?: ReactNode;
}

const SHARED_FONT_STYLE = {
  fontFamily: "var(--font-body)",
  fontSize: "0.85rem",
} as const;

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
      className={cn(
        "relative flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold tracking-wide transition-all duration-200 active:scale-95 overflow-hidden group",
        variant === "primary" && [
          "bg-linear-to-b from-gold-400 to-gold-600 text-neutral-950",
          "hover:from-gold-300 hover:to-gold-500",
          "shadow-lg shadow-gold-900/30 hover:shadow-xl hover:shadow-gold-800/40",
          "border border-gold-300/20",
        ],
        variant === "outline" && [
          "border border-primary/30 hover:border-primary/55 text-primary/80 hover:text-primary",
          "hover:bg-primary/5",
        ],
        className
      )}
      style={SHARED_FONT_STYLE}
    >
      {variant === "primary" && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/15 to-transparent skew-x-12" />
      )}
      {icon}
      {children}
    </Link>
  );
}

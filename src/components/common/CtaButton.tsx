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

export function CtaButton({
  href,
  children,
  variant = "primary",
  className,
  icon,
}: CtaButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold tracking-wide transition-all duration-200 active:scale-95 overflow-hidden group",
        variant === "primary" && [
          "bg-linear-to-b from-gold-400 to-gold-600 text-stone-950",
          "hover:from-gold-300 hover:to-gold-500",
          "shadow-lg shadow-gold-900/30 hover:shadow-xl hover:shadow-gold-800/40",
          "border border-gold-300/20",
        ],
        variant === "outline" && [
          "border border-gold-600/30 hover:border-gold-500/55 text-gold-300/80 hover:text-gold-200",
          "hover:bg-gold-500/5",
        ],
        className
      )}
      style={variant === "primary" ? { fontFamily: "var(--font-display)", fontSize: "0.85rem" } : { fontFamily: "var(--font-display)", fontSize: "0.85rem" }}
    >
      {variant === "primary" && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/15 to-transparent skew-x-12" />
      )}
      {icon}
      {children}
    </Link>
  );
}

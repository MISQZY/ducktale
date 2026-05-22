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
        "flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold tracking-wide transition-all active:scale-95",
        variant === "primary" &&
          "bg-amber-500 hover:bg-amber-400 text-duck-dark hover:shadow-xl hover:shadow-amber-500/30",
        variant === "outline" &&
          "border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200",
        className
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

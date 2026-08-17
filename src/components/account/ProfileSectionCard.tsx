import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileSectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}

/** Shared card shell for the profile dashboard's secondary sections (link status, support) — same corner-ornament border + gold top-line accent used throughout the account pages. */
export function ProfileSectionCard({ title, children, className, titleClassName }: ProfileSectionCardProps) {
  return (
    <div className={cn("liquid-card rounded-2xl border border-primary/20 bg-card/50 p-6 mb-6 relative overflow-hidden", className)}>
      <span className="absolute top-2 left-2 w-1 h-1 rounded-full bg-primary/40 pointer-events-none" aria-hidden="true" />
      <span className="absolute bottom-2 right-2 w-1 h-1 rounded-full bg-primary/40 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />
      <h2 className={cn("text-xs uppercase tracking-widest text-foreground/50 mb-4", titleClassName)}>
        {title}
      </h2>
      {children}
    </div>
  );
}

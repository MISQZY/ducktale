import type { ReactNode } from "react";

interface ProfileSectionCardProps {
  title: string;
  children: ReactNode;
}

/** Shared card shell for the profile dashboard's secondary sections (link status, support) — same corner-ornament border + gold top-line accent used throughout the account pages. */
export function ProfileSectionCard({ title, children }: ProfileSectionCardProps) {
  return (
    <div className="corner-ornament rounded-2xl border border-primary/20 bg-card/50 p-6 mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />
      <h2 className="text-xs uppercase tracking-widest text-foreground/50 mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

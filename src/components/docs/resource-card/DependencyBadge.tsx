import { memo } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dependency } from "./types";

interface DependencyBadgeProps {
  dep: Dependency;
}

export const DependencyBadge = memo(({ dep }: DependencyBadgeProps) => (
  <a
    href={dep.url}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
      "border-primary/20 bg-muted text-foreground/80 hover:text-foreground",
      "hover:border-primary/40 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    )}
  >
    {dep.name}
    <ExternalLink size={11} className="opacity-60" aria-hidden="true" />
    <span className="sr-only">(открывается в новой вкладке)</span>
  </a>
));
DependencyBadge.displayName = "DependencyBadge";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from ".prisma/site-client";

// Fully static per-status class strings (not built from a template) so
// Tailwind's build-time scanner can see and keep them — same reasoning as
// ReportStatusBadge's own STATUS_DOT/STATUS_BADGE.
const STATUS_DOT: Record<ApplicationStatus, string> = {
  OPEN: "bg-amber-400 animate-pulse",
  IN_REVIEW: "bg-sky-400",
  ACCEPTED: "bg-emerald-400",
  REJECTED: "bg-rose-400",
};

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  OPEN: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  IN_REVIEW: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  ACCEPTED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  label: string;
  className?: string;
}

export function ApplicationStatusBadge({ status, label, className }: ApplicationStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[0.65rem] uppercase tracking-widest whitespace-nowrap liquid-badge-none",
        STATUS_BADGE[status],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOT[status])} />
      {label}
    </Badge>
  );
}

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from ".prisma/site-client";

// Fully static per-status class strings (not built from a template) so
// Tailwind's build-time scanner can see and keep them — a `bg-${color}-500`
// interpolation wouldn't be caught by the scanner and would silently emit
// no CSS for it.
const STATUS_DOT: Record<TicketStatus, string> = {
  OPEN: "bg-amber-400 animate-pulse",
  ANSWERED: "bg-sky-400",
  CLOSED: "bg-foreground/30",
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  OPEN: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  ANSWERED: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  CLOSED: "border-foreground/15 bg-foreground/5 text-foreground/40",
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
  label: string;
  className?: string;
}

export function TicketStatusBadge({ status, label, className }: TicketStatusBadgeProps) {
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

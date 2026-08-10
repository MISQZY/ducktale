import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ label, pulse = false, className }: StatusBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 px-5 py-2 rounded-full",
        "border border-primary/25 bg-primary/5 text-primary/90 text-xs tracking-[0.3em] uppercase",
        "backdrop-blur-sm",
        className
      )}
      style={{ boxShadow: "inset 0 1px 0 rgba(212,160,23,0.06), 0 1px 8px rgba(0,0,0,0.3)" }}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full bg-primary/80",
          pulse && "animate-pulse"
        )}
      />
      {label}
    </div>
  );
}

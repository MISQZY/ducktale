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
        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
        "border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs tracking-widest uppercase",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full bg-amber-400",
          pulse && "animate-pulse"
        )}
      />
      {label}
    </div>
  );
}

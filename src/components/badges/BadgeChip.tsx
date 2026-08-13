import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeChipProps {
  name: string;
  icon: string;
  color?: string | null;
  size?: "sm" | "md";
  className?: string;
  onRemove?: () => void;
  disabled?: boolean;
}

/**
 * The visual pill shared by the admin badges list and profile pages —
 * icon + name, with the badge's own accent color applied via inline style
 * since it's an arbitrary per-row hex value, not a Tailwind token the build
 * can see ahead of time.
 */
export function BadgeChip({ name, icon, color, size = "md", className, onRemove, disabled }: BadgeChipProps) {
  const accent = color ?? undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card/70 px-3 py-1 text-xs font-medium text-foreground/90 transition-colors",
        size === "sm" && "px-2 py-0.5 text-[0.7rem] gap-1",
        onRemove && "pr-1",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <BadgeIcon name={icon} size={size === "sm" ? 12 : 14} style={{ color: accent }} className="shrink-0" />
      <span style={{ color: accent }}>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          disabled={disabled}
          className={cn(
            "ml-0.5 rounded-full p-0.5 text-foreground/40 hover:bg-destructive/20 hover:text-destructive transition-colors focus:outline-none",
            size === "sm" ? "p-[2px]" : "p-1"
          )}
          aria-label="Remove badge"
        >
          <X size={size === "sm" ? 10 : 12} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

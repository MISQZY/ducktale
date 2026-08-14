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
        "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card/70 px-3.5 py-1 text-sm font-medium text-foreground/90 transition-colors",
        size === "sm" && "px-2 py-0.5 text-xs gap-1",
        onRemove && "pr-1.5",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <BadgeIcon name={icon} size={size === "sm" ? 14 : 16} style={{ color: accent }} className="shrink-0" />
      <span style={{ color: accent }} className="leading-tight">{name}</span>
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
            "ml-0.5 rounded-full text-foreground/40 hover:bg-foreground/15 hover:text-foreground transition-colors focus:outline-none flex items-center justify-center",
            size === "sm" ? "h-4 w-4" : "h-5 w-5"
          )}
          aria-label="Remove badge"
        >
          <X size={size === "sm" ? 12 : 14} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

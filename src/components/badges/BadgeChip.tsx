import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { cn } from "@/lib/utils";

interface BadgeChipProps {
  name: string;
  icon: string;
  color?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * The visual pill shared by the admin badges list and profile pages —
 * icon + name, with the badge's own accent color applied via inline style
 * since it's an arbitrary per-row hex value, not a Tailwind token the build
 * can see ahead of time.
 */
export function BadgeChip({ name, icon, color, size = "md", className }: BadgeChipProps) {
  const accent = color ?? undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card/70 px-3 py-1 text-xs font-medium text-foreground/90",
        size === "sm" && "px-2 py-0.5 text-[0.7rem] gap-1",
        className
      )}
    >
      <BadgeIcon name={icon} size={size === "sm" ? 12 : 14} style={{ color: accent }} className="shrink-0" />
      <span style={{ color: accent }}>{name}</span>
    </span>
  );
}

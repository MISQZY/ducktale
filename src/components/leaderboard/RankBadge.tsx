import { GiRibbonMedal } from "react-icons/gi";
import { cn } from "@/lib/utils";

const MEDAL_COLOR: Record<1 | 2 | 3, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-700 dark:text-amber-600",
};

export interface RankBadgeProps {
  /** 1-based leaderboard position. */
  rank: number;
  /** Icon/text size in px. Default 16. */
  size?: number;
  /** Multiplier for the medal icon size (since Gi icons might look smaller). Defaults to 1. */
  medalScale?: number;
  className?: string;
  title?: string;
  /**
   * How ranks 4+ render: "circle" (default) as a rounded chip — reads well
   * as a standalone badge next to the profile's playtime stat. "text" is a
   * plain "#N" — the chip is too heavy repeated down every row of the
   * leaderboard table, which already has its own rank column.
   */
  variant?: "circle" | "text";
}

/** Ranks 1-3 render as a colored medal (gold/silver/bronze); everything else per `variant`. */
export function RankBadge({ rank, size = 16, medalScale = 1, className, title, variant = "circle" }: RankBadgeProps) {
  if (rank >= 1 && rank <= 3) {
    const medalRank = rank as 1 | 2 | 3;
    return (
      <GiRibbonMedal
        size={Math.round(size * medalScale)}
        className={cn(MEDAL_COLOR[medalRank], className)}
        aria-label={title}
        role={title ? "img" : undefined}
      />
    );
  }

  if (variant === "text") {
    return (
      <span
        className={cn("font-mono tabular-nums text-foreground/60", className)}
        style={{ fontSize: size * 0.7 }}
        title={title}
      >
        #{rank}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "liquid-badge inline-flex items-center justify-center shrink-0 rounded-full border border-primary/25 bg-primary/10 font-mono tabular-nums text-foreground/70 leading-none",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.65, lineHeight: 1 }}
      title={title}
    >
      {rank}
    </span>
  );
}

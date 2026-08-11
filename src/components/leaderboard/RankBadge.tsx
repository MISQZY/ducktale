import { Medal } from "lucide-react";
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
  className?: string;
  title?: string;
}

/** Ranks 1-3 render as a colored medal (gold/silver/bronze); everything else as a plain "#N". */
export function RankBadge({ rank, size = 16, className, title }: RankBadgeProps) {
  if (rank >= 1 && rank <= 3) {
    const medalRank = rank as 1 | 2 | 3;
    return (
      <Medal
        size={size}
        className={cn(MEDAL_COLOR[medalRank], className)}
        aria-label={title}
        role={title ? "img" : undefined}
      />
    );
  }

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

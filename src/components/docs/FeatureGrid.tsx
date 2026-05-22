import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureGridProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * FeatureGrid.
 *
 * Usage in MDX:
 * ```mdx
 * import { Sword, Map, Users } from "lucide-react";
 * <FeatureGrid features={[
 *   { icon: Sword, title: "PvE", description: "Монстры, данжи, боссы" },
 *   { icon: Map,  title: "Города", description: "Создай свой город с Towny" },
 *   { icon: Users, title: "Экономика", description: "Аукцион, магазины, торговля" },
 * ]} />
 * ```
 */
export function FeatureGrid({ features, columns = 3, className }: FeatureGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 my-6", GRID_COLS[columns], className)}>
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <Card
            key={f.title}
            className="border-amber-900/20 bg-duck-stone/30 hover:border-amber-700/40 hover:bg-duck-stone/50 transition-all duration-200 group"
          >
            <CardHeader className="pb-2">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-950/30 text-amber-400 transition-colors group-hover:border-amber-500/40 group-hover:text-amber-300">
                <Icon size={18} />
              </div>
              <CardTitle className="text-sm text-amber-100">{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-amber-100/50 text-xs leading-relaxed">
                {f.description}
              </CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
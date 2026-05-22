import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

interface ItemCardProps {

  name: string;
  emoji?: string;
  description?: string;
  rarity?: Rarity;
  lore?: string;
  obtain?: string;
  className?: string;
  children?: ReactNode;
}

const RARITY_STYLES: Record<Rarity, { badge: string; title: string; label: string }> = {
  common:    { badge: "bg-stone-800/60 text-stone-300 border-stone-600/30", title: "text-amber-100",  label: "Обычный" },
  uncommon:  { badge: "bg-green-900/50 text-green-300 border-green-700/30", title: "text-green-300",  label: "Необычный" },
  rare:      { badge: "bg-blue-900/50 text-blue-300 border-blue-700/30",    title: "text-blue-300",   label: "Редкий" },
  epic:      { badge: "bg-purple-900/50 text-purple-300 border-purple-700/30", title: "text-purple-300", label: "Эпический" },
  legendary: { badge: "bg-amber-900/50 text-amber-300 border-amber-700/30", title: "text-amber-300",  label: "Легендарный" },
};

export function ItemCard({
  name,
  emoji = "📦",
  description,
  rarity = "common",
  lore,
  obtain,
  className,
  children,
}: ItemCardProps) {
  const r = RARITY_STYLES[rarity];

  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>
        <div
          className={cn(
            "inline-flex items-center gap-2 cursor-default rounded-lg border px-3 py-1.5",
            "border-amber-900/20 bg-duck-stone/40 hover:border-amber-700/30 transition-colors",
            className
          )}
        >
          <span className="text-lg leading-none">{emoji}</span>
          <span className={cn("text-sm font-medium", r.title)}>{name}</span>
          <Badge variant="outline" className={cn("text-[10px] ml-1", r.badge)}>
            {r.label}
          </Badge>
        </div>
      </HoverCardTrigger>

      <HoverCardContent
        className="w-72 border-amber-900/30 bg-duck-dark/95 backdrop-blur-md p-4 space-y-2"
        align="start"
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none">{emoji}</span>
          <div className="min-w-0">
            <p className={cn("font-bold text-sm leading-none", r.title)}>{name}</p>
            <Badge variant="outline" className={cn("mt-1.5 text-[10px]", r.badge)}>
              {r.label}
            </Badge>
          </div>
        </div>

        {description && (
          <p className="text-xs text-amber-100/60 leading-relaxed">{description}</p>
        )}

        {children && (
          <div className="text-xs text-amber-100/70 leading-relaxed border-t border-amber-900/20 pt-2">
            {children}
          </div>
        )}

        {lore && (
          <p className="text-xs italic text-amber-100/40 border-t border-amber-900/20 pt-2">
            {lore}
          </p>
        )}

        {obtain && (
          <div className="text-xs text-amber-100/50 border-t border-amber-900/20 pt-2">
            <span className="text-amber-400/70 font-medium">Получение: </span>
            {obtain}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
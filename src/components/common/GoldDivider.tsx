import { cn } from "@/lib/utils";

interface GoldDividerProps {
  className?: string;
  wide?: boolean;
}

export function GoldDivider({ className, wide = false }: GoldDividerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden="true">
      <div className={cn("h-px bg-linear-to-r from-transparent via-gold-500/50 to-gold-500/20", wide ? "w-32" : "w-10")} />
      <span className="text-gold-600/40 text-xs">◆</span>
      <div className={cn("h-px bg-linear-to-l from-transparent via-gold-500/50 to-gold-500/20", wide ? "w-32" : "w-10")} />
    </div>
  );
}

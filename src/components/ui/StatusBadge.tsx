"use client";
 
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
 
interface StatusBadgeProps {
  online: boolean;
  variant?: "compact" | "full";
}
 
export default function StatusBadge({ online, variant = "compact" }: StatusBadgeProps) {
  const dot = (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full shrink-0",
        online ? "bg-green-400 animate-pulse" : "bg-red-400"
      )}
    />
  );
 
  if (variant === "full") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 border-0 bg-transparent px-0 font-normal text-xs",
          online ? "text-green-400" : "text-red-400"
        )}
      >
        {dot}
        {online ? "Онлайн" : "Офлайн"}
      </Badge>
    );
  }
 
  return dot;
}
 
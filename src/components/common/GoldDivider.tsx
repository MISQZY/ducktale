import { cn } from "@/lib/utils";

interface GoldDividerProps {
  className?: string;
}

export function GoldDivider({ className }: GoldDividerProps) {
  return (
    <div
      className={cn(
        "h-px w-24 bg-linear-to-r from-transparent via-amber-500 to-transparent mx-auto",
        className
      )}
      aria-hidden="true"
    />
  );
}

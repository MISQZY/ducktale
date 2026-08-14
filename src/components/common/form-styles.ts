import { cn } from "@/lib/utils";

export const formInputClasses = (error?: boolean, className?: string) => cn(
  "h-auto rounded-xl border bg-card/50 px-4 py-2 text-sm text-foreground/90",
  "placeholder:text-foreground/45 focus:outline-none focus:ring-0",
  "transition-colors duration-150 hover:bg-card/80",
  error
    ? "border-destructive/50 focus:border-destructive/60"
    : "border-primary/20 focus:border-primary/50",
  className
);

export const formInputStyle = {};

import { cn } from "@/lib/utils";

export const formInputClasses = (error?: boolean, className?: string) => cn(
  "rounded-lg border px-4 py-2.5 text-sm text-foreground",
  "placeholder:text-foreground/30 focus:outline-none focus:ring-1",
  "transition-[border-color,box-shadow] duration-150",
  error
    ? "border-destructive/50 focus:border-destructive/60 focus:ring-destructive/25"
    : "border-[var(--color-input-border)] focus:border-primary/55 focus:ring-primary/25",
  className
);

export const formInputStyle = {
  backgroundColor: "var(--color-input-bg)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
};

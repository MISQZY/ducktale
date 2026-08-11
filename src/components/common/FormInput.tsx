import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function FormInput({ label, hint, error, className, id, ...props }: FormInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs uppercase tracking-widest text-foreground/50">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "rounded-lg border px-4 py-2.5 text-sm text-foreground",
          "placeholder:text-foreground/30 focus:outline-none focus:ring-1",
          "transition-[border-color,box-shadow] duration-150",
          error
            ? "border-destructive/50 focus:border-destructive/60 focus:ring-destructive/25"
            : "border-[var(--color-input-border)] focus:border-primary/55 focus:ring-primary/25",
          className
        )}
        style={{
          backgroundColor: "var(--color-input-bg)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
        }}
        {...props}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-foreground/30">{hint}</p>
      ) : null}
    </div>
  );
}

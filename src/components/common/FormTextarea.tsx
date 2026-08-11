import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/** Same visual language as FormInput, for the multi-line fields it doesn't cover (ticket subject/body). */
export function FormTextarea({ label, hint, error, className, id, ...props }: FormTextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs uppercase tracking-widest text-foreground/50">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "rounded-lg border px-4 py-2.5 text-sm text-foreground resize-none",
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

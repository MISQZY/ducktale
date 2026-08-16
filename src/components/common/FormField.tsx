import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormFieldProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  /** True when this is a required field with no value yet — same small red dot LocalizedNameInput already shows on its RU/EN toggle for an empty locale, next to the label here instead. FormField doesn't know its children's value, so the caller (FormInput/FormTextarea, or a custom field) computes this. */
  requiredEmpty?: boolean;
  children: ReactNode;
}

export function FormField({ id, label, hint, error, requiredEmpty, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center gap-1.5">
          <label htmlFor={id} className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
            {label}
          </label>
          {requiredEmpty && (
            <span className="size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
          )}
          {hint && (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger type="button" tabIndex={-1} className="text-foreground/40 hover:text-foreground/70 transition-colors">
                  <HelpCircle className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs liquid-card border-primary/20 p-2 leading-tight">
                  <p>{hint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

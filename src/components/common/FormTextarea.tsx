import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { formInputClasses, formInputStyle } from "./form-styles";
import { Textarea } from "@/components/ui/textarea";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/** Same visual language as FormInput, for the multi-line fields it doesn't cover (ticket subject/body). */
export function FormTextarea({ label, hint, error, className, id, required, value, ...props }: FormTextareaProps) {
  // Same controlled-only caveat as FormInput's missing check.
  const missing = required && value !== undefined && !String(value).trim();
  return (
    <FormField id={id} label={label} hint={hint} error={error} requiredEmpty={missing}>
      <Textarea
        id={id}
        required={required}
        value={value}
        className={cn("resize-none", formInputClasses(!!error || missing, className))}
        style={formInputStyle}
        {...props}
      />
    </FormField>
  );
}

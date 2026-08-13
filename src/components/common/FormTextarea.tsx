import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { formInputClasses, formInputStyle } from "./form-styles";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/** Same visual language as FormInput, for the multi-line fields it doesn't cover (ticket subject/body). */
export function FormTextarea({ label, hint, error, className, id, ...props }: FormTextareaProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        className={cn("resize-none", formInputClasses(!!error, className))}
        style={formInputStyle}
        {...props}
      />
    </FormField>
  );
}

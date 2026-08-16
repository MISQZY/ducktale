import type { InputHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { formInputClasses, formInputStyle } from "./form-styles";
import { Input } from "@/components/ui/input";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function FormInput({ label, hint, error, className, id, required, value, ...props }: FormInputProps) {
  // Only meaningful for a controlled input (value passed in) — an
  // uncontrolled field (defaultValue, no value prop) can't be tracked
  // reactively here, so it's left exactly as before (no dot, no highlight).
  const missing = required && value !== undefined && !String(value).trim();
  return (
    <FormField id={id} label={label} hint={hint} error={error} requiredEmpty={missing}>
      <Input
        id={id}
        required={required}
        value={value}
        className={formInputClasses(!!error || missing, className)}
        style={formInputStyle}
        {...props}
      />
    </FormField>
  );
}

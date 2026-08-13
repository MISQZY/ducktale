import type { InputHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { formInputClasses, formInputStyle } from "./form-styles";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function FormInput({ label, hint, error, className, id, ...props }: FormInputProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        className={formInputClasses(!!error, className)}
        style={formInputStyle}
        {...props}
      />
    </FormField>
  );
}

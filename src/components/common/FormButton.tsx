"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ctaButtonClasses, CtaShine, CTA_FONT_STYLE, type CtaVariant } from "./cta-button-styles";

interface FormButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: CtaVariant;
  icon?: ReactNode;
  className?: string;
}

/**
 * The CtaButton look, as a real <button> — for form submits and other
 * actions that aren't navigation (CtaButton always renders a Link).
 */
export function FormButton({
  variant = "primary",
  icon,
  className,
  children,
  type = "button",
  ...props
}: FormButtonProps) {
  return (
    <Button
      type={type}
      variant="ghost"
      className={ctaButtonClasses(variant, className)}
      style={CTA_FONT_STYLE}
      {...props}
    >
      <CtaShine variant={variant} />
      {icon}
      {children}
    </Button>
  );
}

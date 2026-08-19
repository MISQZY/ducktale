import { cn } from "@/lib/utils";

export type CtaVariant = "primary" | "outline" | "destructive";

export const CTA_FONT_STYLE = {
  fontFamily: "var(--font-body)",
  fontSize: "0.85rem",
} as const;

/**
 * Shared between CtaButton (renders a Link) and FormButton (renders a real
 * <button>, for actual form submits) so the two never visually drift apart
 * — a page mixing the two should look like one button family, not two.
 */
export function ctaButtonClasses(variant: CtaVariant, className?: string) {
  return cn(
    "h-auto relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold tracking-wide transition-all duration-200 active:scale-95 group",
    "disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100",
    variant === "primary" && [
      "overflow-hidden",
      "bg-linear-to-b from-gold-400 to-gold-600 text-neutral-950",
      "hover:from-gold-300 hover:to-gold-500",
      "shadow-lg shadow-gold-900/30 hover:shadow-xl hover:shadow-gold-800/40",
      "border border-gold-300/20",
    ],
    variant === "outline" && [
      "border border-primary/30 hover:border-primary/55 text-primary/80 hover:text-primary",
      "hover:bg-primary/5",
    ],
    variant === "destructive" && [
      "border border-destructive/25 hover:border-destructive/45 text-destructive/70 hover:text-destructive",
      "hover:bg-destructive/5",
    ],
    className
  );
}

export function CtaShine({ variant }: { variant: CtaVariant }) {
  if (variant !== "primary") return null;
  return (
    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/15 to-transparent skew-x-12" />
  );
}

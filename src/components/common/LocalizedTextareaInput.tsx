"use client";

import { Textarea } from "@/components/ui/textarea";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { cn } from "@/lib/utils";
import type { LocalizedName } from "@/lib/i18n-name";

const LOCALES = ["ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

interface LocalizedTextareaInputProps {
  id: string;
  label: string;
  /** Real <textarea name> for each locale's hidden field — matches the server action's formData.get("descriptionRu"/"descriptionEn") reads. */
  ruName: string;
  enName: string;
  value: LocalizedName;
  onChange: (value: LocalizedName) => void;
  active: Locale;
  onActiveChange: (locale: Locale) => void;
  maxLength?: number;
  rows?: number;
}

/**
 * Multi-line twin of LocalizedNameInput (same file's doc comment explains the
 * lifted-state + hidden-inputs + RU/EN toggle shape) — split out rather than
 * adding a `multiline` prop to that component, since a single-line Input vs
 * a Textarea need different underlying elements, not just a style tweak.
 */
export function LocalizedTextareaInput({
  id,
  label,
  ruName,
  enName,
  value,
  onChange,
  active,
  onActiveChange,
  maxLength,
  rows = 3,
}: LocalizedTextareaInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs uppercase tracking-widest text-foreground/50 leading-none">
          {label}
        </label>
        <div className="flex rounded-md border border-primary/20 overflow-hidden">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => onActiveChange(locale)}
              className={cn(
                "relative px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors cursor-pointer",
                active === locale ? "bg-primary text-primary-foreground" : "text-foreground/50 hover:text-foreground/80"
              )}
            >
              {locale}
              {!value[locale] && <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-destructive" />}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        id={id}
        value={value[active]}
        onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        maxLength={maxLength}
        rows={rows}
        className={cn("resize-none", formInputClasses(false))}
        style={formInputStyle}
      />
      <input type="hidden" name={ruName} value={value.ru} />
      <input type="hidden" name={enName} value={value.en} />
    </div>
  );
}

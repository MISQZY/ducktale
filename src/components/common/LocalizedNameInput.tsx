"use client";

import { Input } from "@/components/ui/input";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import { cn } from "@/lib/utils";
import type { LocalizedName } from "@/lib/i18n-name";

const LOCALES = ["ru", "en"] as const;
type Locale = (typeof LOCALES)[number];

interface LocalizedNameInputProps {
  id: string;
  label: string;
  /** Real <input name> for each locale's hidden field — matches the server action's formData.get("nameRu"/"nameEn") reads, unchanged by this being a single visible field. */
  ruName: string;
  enName: string;
  value: LocalizedName;
  onChange: (value: LocalizedName) => void;
  active: Locale;
  onActiveChange: (locale: Locale) => void;
  maxLength?: number;
}

/**
 * One visible text input editing a LocalizedName, with a small RU/EN toggle
 * next to the label instead of two separate always-visible inputs. Both
 * locale values live in the parent's state (`value`/`onChange`, same lifted-
 * state + reset-on-reopen pattern RoleFormDialog already uses for its other
 * fields) and are always submitted via hidden inputs regardless of which one
 * is currently shown, so switching the toggle never loses what was typed in
 * the other. A dot on a toggle button marks that locale as still empty —
 * both are required, enforced server-side (readRoleFields /
 * upsertResourceLabel throw if either is blank); this is just a heads-up
 * before submitting.
 */
export function LocalizedNameInput({ id, label, ruName, enName, value, onChange, active, onActiveChange, maxLength }: LocalizedNameInputProps) {
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
              {/* Inset (not -top/-right) so the dot stays inside this button's own box — a negative offset bled into the neighboring locale button's paint area (RU's dot got half-covered by EN) and would get clipped by the wrapper's overflow-hidden (needed for the pill's rounded corners) on the outer edge. */}
              {!value[locale] && <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-destructive" />}
            </button>
          ))}
        </div>
      </div>
      <Input
        id={id}
        value={value[active]}
        onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        maxLength={maxLength}
        className={formInputClasses(false)}
        style={formInputStyle}
      />
      <input type="hidden" name={ruName} value={value.ru} />
      <input type="hidden" name={enName} value={value.en} />
    </div>
  );
}

"use client";

import { useMemo, useState, useEffect } from "react";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { LUCIDE_ICON_NAMES, DEFAULT_BADGE_ICONS } from "@/config/badges";
import { getGiIconKeys } from "@/lib/actions/icons";
import { cn } from "@/lib/utils";

const MAX_ICON_RESULTS = 200;

interface IconPickerFieldProps {
  icon: string;
  setIcon: (icon: string) => void;
  iconQuery: string;
  setIconQuery: (query: string) => void;
  label: string;
  searchPlaceholder: string;
  emptyMessage: string;
}

export function IconPickerField({
  icon,
  setIcon,
  iconQuery,
  setIconQuery,
  label,
  searchPlaceholder,
  emptyMessage,
}: IconPickerFieldProps) {
  const [giIcons, setGiIcons] = useState<string[]>([]);

  useEffect(() => {
    getGiIconKeys().then((keys) => setGiIcons(keys)).catch(console.error);
  }, []);

  const visibleIcons = useMemo(() => {
    const query = iconQuery.trim().toLowerCase();
    if (!query) return DEFAULT_BADGE_ICONS;
    const allNames = [...LUCIDE_ICON_NAMES, ...giIcons];
    return allNames.filter((name) => name.toLowerCase().includes(query)).slice(0, MAX_ICON_RESULTS);
  }, [iconQuery, giIcons]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs uppercase tracking-widest text-foreground/50">{label}</label>
      <input type="hidden" name="icon" value={icon} />
      <input
        type="text"
        value={iconQuery}
        onChange={(e) => setIconQuery(e.target.value)}
        placeholder={searchPlaceholder}
        className="rounded-lg border border-[var(--color-input-border)] px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/55 focus:ring-1 focus:ring-primary/25"
        style={{ backgroundColor: "var(--color-input-bg)" }}
      />
      <div className="grid grid-cols-8 content-start gap-1.5 max-h-[136px] overflow-y-auto rounded-lg border border-primary/10 p-1.5">
        {visibleIcons.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setIcon(name)}
            aria-label={name}
            aria-pressed={icon === name}
            title={name}
            className={cn(
              "flex items-center justify-center rounded-lg border p-2 transition-colors",
              icon === name
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-primary/15 text-foreground/50 hover:border-primary/30 hover:text-foreground/80"
            )}
          >
            <BadgeIcon name={name} size={18} />
          </button>
        ))}
        {visibleIcons.length === 0 && (
          <p className="col-span-8 text-xs text-foreground/35 py-2 text-center">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}

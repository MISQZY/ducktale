"use client";

import { useMemo, useState, useEffect } from "react";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { LUCIDE_ICON_NAMES, DEFAULT_BADGE_ICONS } from "@/config/badges";
import { getGiIconKeys } from "@/lib/actions/icons";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";
import { FormField } from "@/components/common/FormField";
import { formInputClasses, formInputStyle } from "@/components/common/form-styles";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

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
  const [open, setOpen] = useState(false);

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
    <FormField id="icon" label={label}>
        <input type="hidden" name="icon" value={icon} />
      
      {/* Not modal={true}: nested inside AdminFormDialog, whose own modal Dialog already traps focus — a modal Popover's hideOthers() would make that Dialog (and this trigger) inert right as it opens. */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={formInputClasses(false, "flex w-full items-center justify-between cursor-pointer")}
            style={formInputStyle}
          >
            <div className="flex items-center gap-2">
              <BadgeIcon name={icon} size={16} />
              <span className="truncate">{icon}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-2 rounded-xl liquid-card border-primary/20" align="start">
          <SearchInput
            value={iconQuery}
            onChange={(e) => setIconQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="text-xs"
            wrapperClassName="mb-2"
          />
          <div className="grid grid-cols-6 content-start gap-1.5 max-h-[220px] overflow-y-auto rounded-lg border border-primary/10 p-1.5">
            {visibleIcons.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setIcon(name);
                  setOpen(false);
                }}
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
              <p className="col-span-6 text-xs text-foreground/35 py-2 text-center">{emptyMessage}</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </FormField>
  );
}

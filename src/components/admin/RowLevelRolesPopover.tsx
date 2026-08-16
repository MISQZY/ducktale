"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface RowLevelRolesPopoverProps {
  names: string[];
}

/** Collapsed-by-default "Роли уровня строк" summary for one Role row — same pattern as RoleGrantsPopover (count badge, click to expand), instead of the pill list always taking up row height. */
export function RowLevelRolesPopover({ names }: RowLevelRolesPopoverProps) {
  const tr = useTranslations("Admin.roles");
  const [open, setOpen] = useState(false);

  if (names.length === 0) return <span className="text-foreground/30">—</span>;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-primary transition-colors cursor-pointer"
        >
          <span>{tr("rowLevelRolesLabel")}</span>
          <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
            {names.length}
          </span>
          <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-max max-w-sm p-3 rounded-xl liquid-card border-primary/20" align="start">
        <div className="flex flex-col gap-1 max-h-55 overflow-y-auto overflow-x-hidden">
          {names.map((name, i) => (
            <span key={i} className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[11px] text-foreground/70 truncate">
              {name}
            </span>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

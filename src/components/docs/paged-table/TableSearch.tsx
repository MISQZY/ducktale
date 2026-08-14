"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";

interface TrailingAction {
  icon:    React.ReactNode;
  onClick: () => void;
  label:   string;
}

interface TableSearchProps {
  value:           string;
  onChange:        (v: string) => void;
  placeholder?:    string;
  className?:      string;
  /** Optional extra button rendered next to the clear ("X") button. */
  trailingAction?: TrailingAction;
}

export function TableSearch({ value, onChange, placeholder = "Найти", className, trailingAction }: TableSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative w-full sm:w-56", className)}>
      <Search size={16} className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2", DOCS_TABLE_THEME.iconMuted)} />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          trailingAction ? (value ? "pr-14" : "pr-8") : "pr-8",
          "focus:outline-none",
          "transition-colors duration-150",
        )}
        style={{ paddingLeft: "2.5rem" }}
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); inputRef.current?.focus(); }}
            className={cn("transition-colors", DOCS_TABLE_THEME.iconFaint, DOCS_TABLE_THEME.iconFaintHover)}
            aria-label="Очистить поиск"
          >
            <X size={13} />
          </button>
        )}
        {trailingAction && (
          <button
            type="button"
            onClick={trailingAction.onClick}
            className={cn("transition-colors", DOCS_TABLE_THEME.iconFaint, DOCS_TABLE_THEME.iconFaintHover)}
            aria-label={trailingAction.label}
            title={trailingAction.label}
          >
            {trailingAction.icon}
          </button>
        )}
      </div>
    </div>
  );
}

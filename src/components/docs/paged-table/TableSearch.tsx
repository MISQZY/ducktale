"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { DOCS_TABLE_THEME } from "@/components/ui/docs-table";

interface TableSearchProps {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  className?:   string;
}

export function TableSearch({ value, onChange, placeholder = "Поиск…", className }: TableSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative w-full sm:w-56", className)}>
      <Search size={13} className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2", DOCS_TABLE_THEME.iconMuted)} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className={cn(
          "w-full rounded-lg border py-1.5 pl-8 pr-8",
          DOCS_TABLE_THEME.surfaceBg,
          "text-sm",
          DOCS_TABLE_THEME.text,
          DOCS_TABLE_THEME.placeholder,
          DOCS_TABLE_THEME.border,
          DOCS_TABLE_THEME.borderFocus,
          "focus:outline-none",
          "transition-colors duration-150",
        )}
      />
      {value && (
        <button
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
          className={cn("absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors", DOCS_TABLE_THEME.iconFaint, DOCS_TABLE_THEME.iconFaintHover)}
          aria-label="Очистить поиск"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

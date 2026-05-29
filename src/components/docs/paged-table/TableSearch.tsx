"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

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
      <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#BFA246]/50" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className={cn(
          "w-full rounded-lg border bg-[#12100c] py-1.5 pl-8 pr-8",
          "text-sm text-[#FFF4CC]/88 placeholder:text-[#BFA246]/35",
          "border-[#BFA246]/18 focus:border-[#BFA246]/45 focus:outline-none",
          "transition-colors duration-150",
        )}
      />
      {value && (
        <button
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#BFA246]/40 hover:text-[#BFA246]/70 transition-colors"
          aria-label="Очистить поиск"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

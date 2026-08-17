"use client";

import { useEffect, useRef, useState } from "react";
import { FormInput } from "@/components/common/FormInput";
import { cn } from "@/lib/utils";
import type { PlayerSearchResponse, PlayerSuggestion } from "@/types/player-card";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 250;

interface PlayerNicknameInputProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  noMatchesLabel: string;
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/**
 * Typeahead for "which Minecraft player is this about" — used by
 * NewReportForm for `reportedName`. Not a full PlayerCard lookup (no skin/
 * playtime), just the same debounced GET /api/player-card/search suggestion
 * list PlayerCard.tsx already queries, trimmed to name-picking. The reported
 * player may have no site account and isn't required to actually exist in
 * this list — a report names a Minecraft nickname, not a resolved player
 * record, so free typing is always allowed alongside the suggestions.
 */
export function PlayerNicknameInput({
  id,
  name,
  label,
  placeholder,
  noMatchesLabel,
  maxLength,
  value,
  onChange,
  required,
}: PlayerNicknameInputProps) {
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale suggestions from a previous longer query when the input shrinks below the search threshold, not a render-driven computation
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/player-card/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data: PlayerSearchResponse) => setSuggestions(data.results ?? []))
        .catch(() => {});
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const showDropdown = open && value.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative">
      <FormInput
        id={id}
        name={name}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        maxLength={maxLength}
        required={required}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-primary/20 bg-card/95 backdrop-blur shadow-lg overflow-hidden">
          {suggestions.length === 0 ? (
            <p className="px-3 py-2 text-xs text-foreground/40">{noMatchesLabel}</p>
          ) : (
            suggestions.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => {
                  onChange(s.name);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground/80",
                  "hover:bg-primary/10 transition-colors"
                )}
              >
                <span className="truncate">{s.name}</span>
                {s.nickname && s.nickname !== s.name && (
                  <span className="truncate text-foreground/40">({s.nickname})</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

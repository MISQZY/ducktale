"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Clock, Sprout, Castle, Flag, VenusAndMars, UserRound, AlertCircle, CircleCheck, RefreshCw,
} from "lucide-react";
import { DuckCard, DuckCardContent } from "@/components/ui/duck/card";
import { TableSearch } from "@/components/docs/paged-table";
import type {
  Gender, GrowthStatus, PlayerCard as PlayerCardData, PlayerCardResponse,
  PlayerSearchResponse, PlayerSuggestion,
} from "@/types/player-card";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MIN_SEARCH_LENGTH = 3;

const GENDER_LABEL: Record<NonNullable<Gender>, string> = {
  male:   "Мужской",
  female: "Женский",
};

function formatDurationMs(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} д ${hours} ч ${minutes} м`;
  if (hours > 0) return `${hours} ч ${minutes} м`;
  return `${minutes} м`;
}

// ─── Skin face (CSS-cropped from the 64×64 Minecraft skin texture) ────────────

function SkinFace({ skinUrl, size = 88 }: { skinUrl: string | null; size?: number }) {
  if (!skinUrl) {
    return (
      <div
        className="flex items-center justify-center shrink-0 rounded-xl border border-primary/20 bg-muted"
        style={{ width: size, height: size }}
      >
        <UserRound size={size * 0.4} className="text-foreground/25" />
      </div>
    );
  }

  // Source texture is 64×64. Scaling the whole 64px texture up by (size/8)
  // makes one source pixel = size/8 display px, so background-size is 8×size
  // and a region's offset is -(sourceX * size/8), -(sourceY * size/8).
  // Head:  8:08–15:15 inclusive → offset (-size, -size).
  // Mask: 40:08–47:15 inclusive → offset (-5×size, -size), rendered on top.
  const bgSize = `${size * 8}px ${size * 8}px`;
  const headPos = `${-size}px ${-size}px`;
  const maskPos = `${-5 * size}px ${-size}px`;

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl border border-primary/20 bg-muted"
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${skinUrl})`, backgroundSize: bgSize, backgroundPosition: headPos }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${skinUrl})`, backgroundSize: bgSize, backgroundPosition: maskPos }}
      />
    </div>
  );
}

// ─── Info rows ────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon size={14} className="text-primary/60 shrink-0 mt-0.5" />
      <span className="text-foreground/45 w-20 shrink-0">{label}</span>
      <span className="text-foreground/85 font-medium break-words min-w-0">{children}</span>
    </div>
  );
}

function GrowthValue({ growth }: { growth: GrowthStatus }) {
  if (growth.state === "unknown") return <span className="text-foreground/40 italic font-normal">Нет данных</span>;
  if (growth.state === "complete") return <span className="text-emerald-700 dark:text-emerald-400">Рост завершён</span>;
  return <span>Осталось {formatDurationMs(growth.secondsRemaining * 1000)}</span>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const CARD_BODY_HEIGHT = 168; // px — shared height for the head/info split row

function PlayerCardView({ player }: { player: PlayerCardData }) {
  return (
    <DuckCard className="border-primary/20 bg-duck-stone/40">
      <DuckCardContent className="pt-4">
        <div className="flex items-center justify-center gap-1.5 min-w-0">
          <h3
            className="text-lg font-bold text-foreground leading-none truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {player.nickname}
          </h3>
          {player.whitelisted && (
            <span title="В вайтлисте сервера">
              <CircleCheck size={16} className="text-emerald-500 shrink-0" aria-label="В вайтлисте сервера" />
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-3" style={{ height: CARD_BODY_HEIGHT }}>
          {/* Left half: head */}
          <div className="w-1/2 flex items-center justify-center">
            <SkinFace skinUrl={player.skinUrl} size={CARD_BODY_HEIGHT - 24} />
          </div>

          {/* Right half: info, scrolls if it overflows the shared height */}
          <div className="w-1/2 flex flex-col gap-1.5 overflow-y-auto pr-1">
            <InfoRow icon={UserRound} label="Игрок">
              {player.username}
            </InfoRow>
            <InfoRow icon={Clock} label="Игровое время">
              {formatDurationMs(player.playtimeMs)}
            </InfoRow>
            <InfoRow icon={VenusAndMars} label="Пол">
              {player.gender ? GENDER_LABEL[player.gender] : <span className="text-foreground/40 italic font-normal">Нет данных</span>}
            </InfoRow>
            <InfoRow icon={Sprout} label="Рост">
              <GrowthValue growth={player.growth} />
            </InfoRow>
            <InfoRow icon={Castle} label="Город">
              {player.city ?? <span className="text-foreground/40 italic font-normal">—</span>}
            </InfoRow>
            <InfoRow icon={Flag} label="Нация">
              {player.nation ?? <span className="text-foreground/40 italic font-normal">{player.city ? "Независимый" : "—"}</span>}
            </InfoRow>
          </div>
        </div>
      </DuckCardContent>
    </DuckCard>
  );
}

function NotFoundCard({ query }: { query: string }) {
  return (
    <DuckCard className="border-red-900/30 bg-duck-stone/40">
      <DuckCardContent className="flex items-center gap-3 py-6 justify-center text-center">
        <AlertCircle size={18} className="text-red-600/70 dark:text-red-400/70 shrink-0" />
        <p className="text-sm text-red-600/70 dark:text-red-400/70">
          {query ? `Игрок «${query}» не найден` : "Игрок не найден"}
        </p>
      </DuckCardContent>
    </DuckCard>
  );
}

function SkeletonCard() {
  return (
    <DuckCard className="border-primary/20 bg-duck-stone/40">
      <DuckCardContent className="pt-4 animate-pulse">
        <div className="h-5 w-40 mx-auto rounded bg-muted" />
        <div className="flex gap-2 mt-3" style={{ height: CARD_BODY_HEIGHT }}>
          <div className="w-1/2 flex items-center justify-center">
            <div className="rounded-xl bg-muted" style={{ width: CARD_BODY_HEIGHT - 24, height: CARD_BODY_HEIGHT - 24 }} />
          </div>
          <div className="w-1/2 flex flex-col gap-2.5 pt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3.5 w-full max-w-40 rounded bg-muted" />
            ))}
          </div>
        </div>
      </DuckCardContent>
    </DuckCard>
  );
}

function SuggestionsDropdown({
  suggestions,
  onSelect,
}: {
  suggestions: PlayerSuggestion[];
  onSelect: (name: string) => void;
}) {
  return (
    <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden py-1">
      {suggestions.map((s) => (
        <button
          key={s.name}
          type="button"
          onMouseDown={(e) => e.preventDefault()} // keep the input from blurring before onClick fires
          onClick={() => onSelect(s.name)}
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
        >
          <span className="text-foreground/85 font-medium truncate">{s.nickname ?? s.name}</span>
          <span className="text-foreground/40 text-xs shrink-0">{s.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PlayerCardProps {
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerCard({ className }: PlayerCardProps) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  // Bumped on every refresh-button click so the fetch effect re-runs even
  // when query is already "" (setting state to an unchanged value wouldn't
  // otherwise trigger the [query] effect below).
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [data, setData] = useState<PlayerCardResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInput = (value: string) => {
    setInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      // Cleared entirely — revert to a random player, hide the dropdown.
      searchDebounceRef.current = setTimeout(() => setQuery(""), 300);
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (trimmed.length < MIN_SEARCH_LENGTH) {
      // Too short to search yet — leave the currently shown card as-is.
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Only fetch the lightweight suggestions list while typing. The full
    // card (4 separate database round-trips) only loads when the user
    // explicitly picks a suggestion or presses Enter — not on every
    // debounced keystroke, which was firing a full card reload for every
    // 3+ char prefix typed.
    suggestDebounceRef.current = setTimeout(() => {
      fetch(`/api/player-card/search?q=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((res: PlayerSearchResponse) => {
          setSuggestions(res.results);
          setShowDropdown(res.results.length > 0);
        })
        .catch(() => {});
    }, 300);
  };

  const submitSearch = (value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    setQuery(value.trim());
    setSuggestions([]);
    setShowDropdown(false);
  };

  const selectSuggestion = (name: string) => {
    setInput(name);
    submitSearch(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const trimmed = input.trim();
    if (trimmed.length === 0 || trimmed.length >= MIN_SEARCH_LENGTH) submitSearch(trimmed);
  };

  const handleRefresh = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    setInput("");
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setRefreshNonce((n) => n + 1);
  };

  // Close the dropdown on any click outside the search box.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting state synchronously when query changes, before async fetch starts
    setStatus("loading");

    const params = query ? `?search=${encodeURIComponent(query)}` : "";
    fetch(`/api/player-card${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res: PlayerCardResponse) => {
        if (cancelled) return;
        setData(res);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => { cancelled = true; };
  }, [query, refreshNonce]);

  return (
    <div className={cn("not-prose flex flex-col gap-3", className)}>
      <div ref={containerRef} className="relative w-full sm:w-72" onKeyDown={handleKeyDown}>
        <TableSearch
          value={input}
          onChange={handleInput}
          placeholder="Поиск по нику или имени…"
          className="w-full"
          trailingAction={{
            icon: <RefreshCw size={13} />,
            onClick: handleRefresh,
            label: "Случайный игрок",
          }}
        />
        {showDropdown && suggestions.length > 0 && (
          <SuggestionsDropdown suggestions={suggestions} onSelect={selectSuggestion} />
        )}
      </div>

      {status === "loading" && <SkeletonCard />}

      {status === "error" && (
        <DuckCard className="border-red-900/30 bg-duck-stone/40">
          <DuckCardContent className="py-6 text-center">
            <p className="text-sm text-red-600/70 dark:text-red-400/70">Не удалось загрузить данные игрока</p>
          </DuckCardContent>
        </DuckCard>
      )}

      {status === "success" && (data?.player
        ? <PlayerCardView player={data.player} />
        : <NotFoundCard query={query} />
      )}
    </div>
  );
}

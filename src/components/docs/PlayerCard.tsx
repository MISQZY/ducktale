"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Clock, Sprout, Castle, Flag, VenusAndMars, UserRound, AlertCircle, CircleCheck, RefreshCw, LogIn, BadgeCheck,
} from "lucide-react";
import { DuckCard, DuckCardContent } from "@/components/ui/duck/card";
import { TableSearch } from "@/components/docs/paged-table";
import { RESIDENT_ROLE_COLOR } from "@/lib/towny";
import { SkinFace } from "@/components/common/SkinFace";
import { formatDurationMs, formatLastSeen } from "@/lib/player-card-format";
import type {
  GrowthStatus, PlayerCard as PlayerCardData, PlayerCardResponse,
  PlayerSearchResponse, PlayerSuggestion,
} from "@/types/player-card";
import type { ResidentRole } from "@/types/towny";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MIN_SEARCH_LENGTH = 3;

// Remembers which player was last shown so a page reload re-fetches that
// same player (with fresh data) instead of the initial GET picking a new
// random one — only the refresh button should ever change who's shown.
const LAST_PLAYER_STORAGE_KEY = "playercard:lastPlayer";

function getStoredPlayer(): string {
  try { return localStorage.getItem(LAST_PLAYER_STORAGE_KEY) ?? ""; } catch { return ""; }
}

function setStoredPlayer(name: string) {
  try { localStorage.setItem(LAST_PLAYER_STORAGE_KEY, name); } catch { /* */ }
}

// ─── Info rows ────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon size={14} className="text-primary/60 shrink-0 mt-0.5" />
      <span className="text-foreground/45 w-28 shrink-0 whitespace-nowrap">{label}</span>
      <span className="text-foreground/85 font-medium wrap-break-word min-w-0">{children}</span>
    </div>
  );
}

function GrowthValue({ growth }: { growth: GrowthStatus }) {
  const t = useTranslations("PlayerCard");
  if (growth.state === "unknown") return <span className="text-foreground/40 italic font-normal">{t("noData")}</span>;
  if (growth.state === "complete") return <span className="text-emerald-700 dark:text-emerald-400">{t("growth.complete")}</span>;
  return <span>{t("growth.remaining", { time: formatDurationMs(growth.secondsRemaining * 1000, t) })}</span>;
}

function LastLoginValue({ online, lastSeenMs }: { online: boolean; lastSeenMs: number }) {
  const t = useTranslations("PlayerCard");
  const locale = useLocale();
  if (online) return <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t("online")}</span>;
  if (!lastSeenMs) return <span className="text-foreground/40 italic font-normal">{t("noData")}</span>;
  return <span>{formatLastSeen(lastSeenMs, locale)}</span>;
}

function PositionValue({ role }: { role: ResidentRole }) {
  const t = useTranslations("PlayerCard");
  if (!role) return <span>{t("resident")}</span>;
  return <span className={RESIDENT_ROLE_COLOR[role]}>{t(`role.${role}`)}</span>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const CARD_BODY_HEIGHT = 168; // px — base size for the head image

function PlayerCardView({ player }: { player: PlayerCardData }) {
  const t = useTranslations("PlayerCard");
  return (
    <DuckCard className="border-primary/20 bg-duck-stone/40 min-h-70">
      <DuckCardContent className="pt-4 flex-1 flex flex-col">
        <div className="flex items-center justify-center gap-1.5 min-w-0">
          <h3
            className="text-lg font-bold text-foreground leading-none truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {player.nickname}
          </h3>
          {player.whitelisted && (
            <span title={t("whitelistedTitle")}>
              <CircleCheck size={16} className="text-emerald-500 shrink-0" aria-label={t("whitelistedTitle")} />
            </span>
          )}
        </div>

        {/* flex-1: fills the remaining height of the card (min-h-[280px]) instead of a fixed px height */}
        <div className="flex-1 flex gap-5 mt-3">
          {/* Left: head, sized to its own content so the info column keeps whatever's left */}
          <div className="shrink-0 flex items-center justify-center" style={{ width: CARD_BODY_HEIGHT - 24 }}>
            <SkinFace skinUrl={player.skinUrl} size={CARD_BODY_HEIGHT - 24} />
          </div>

          {/* Right: info, stretches to the row's full height and takes all remaining width; scrolls if it overflows */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5 overflow-y-auto pr-1">
            <InfoRow icon={UserRound} label={t("labels.player")}>
              {player.username}
            </InfoRow>
            <InfoRow icon={LogIn} label={t("labels.lastLogin")}>
              <LastLoginValue online={player.online} lastSeenMs={player.lastSeenMs} />
            </InfoRow>
            <InfoRow icon={Clock} label={t("labels.playtime")}>
              {formatDurationMs(player.playtimeMs, t)}
            </InfoRow>
            <InfoRow icon={VenusAndMars} label={t("labels.gender")}>
              {player.gender ? t(`gender.${player.gender}`) : <span className="text-foreground/40 italic font-normal">{t("noData")}</span>}
            </InfoRow>
            <InfoRow icon={Sprout} label={t("labels.growth")}>
              <GrowthValue growth={player.growth} />
            </InfoRow>
            {/* City/position/nation are optional — the whole line is omitted when the player has no data for it */}
            {player.city && (
              <InfoRow icon={Castle} label={t("labels.city")}>
                {player.city}
              </InfoRow>
            )}
            {player.city && (
              <InfoRow icon={BadgeCheck} label={t("labels.position")}>
                <PositionValue role={player.role} />
              </InfoRow>
            )}
            {player.nation && (
              <InfoRow icon={Flag} label={t("labels.nation")}>
                {player.nation}
              </InfoRow>
            )}
          </div>
        </div>
      </DuckCardContent>
    </DuckCard>
  );
}

function NotFoundCard({ query }: { query: string }) {
  const t = useTranslations("PlayerCard");
  return (
    <DuckCard className="border-red-900/30 bg-duck-stone/40">
      <DuckCardContent className="flex items-center gap-3 py-6 justify-center text-center">
        <AlertCircle size={18} className="text-red-600/70 dark:text-red-400/70 shrink-0" />
        <p className="text-sm text-red-600/70 dark:text-red-400/70">
          {query ? t("notFoundQuery", { query }) : t("notFound")}
        </p>
      </DuckCardContent>
    </DuckCard>
  );
}

function SkeletonCard() {
  return (
    <DuckCard className="border-primary/20 bg-duck-stone/40 min-h-70">
      <DuckCardContent className="pt-4 flex-1 flex flex-col animate-pulse">
        <div className="h-5 w-40 mx-auto rounded bg-muted" />
        <div className="flex-1 flex gap-5 mt-3">
          <div className="shrink-0 flex items-center justify-center" style={{ width: CARD_BODY_HEIGHT - 24 }}>
            <div className="rounded-xl bg-muted" style={{ width: CARD_BODY_HEIGHT - 24, height: CARD_BODY_HEIGHT - 24 }} />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2.5 pt-1">
            {Array.from({ length: 8 }).map((_, i) => (
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
  const t = useTranslations("PlayerCard");
  // Both start empty to match the server-rendered markup — localStorage
  // isn't available during SSR, so reading it here would cause a hydration
  // mismatch. The stored player (if any) is restored client-side by the
  // fetch effect below, on its first run.
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const restoredRef = useRef(false);
  // Bumped on every refresh-button click so the fetch effect re-runs even
  // when query is already "" (setting state to an unchanged value wouldn't
  // otherwise trigger the [query] effect below).
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [data, setData] = useState<PlayerCardResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInput = (value: string) => {
    setInput(value);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      // Cleared entirely — just hide the dropdown. Whatever player is
      // currently shown (random or explicitly picked) stays put; only the
      // refresh button should ever pick a new random player.
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
    // Enter on an empty box no longer picks a random player — only the
    // refresh button does that now. A real search still submits on Enter.
    if (trimmed.length >= MIN_SEARCH_LENGTH) submitSearch(trimmed);
  };

  const handleRefresh = () => {
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
    // On the very first run, restore whichever player was last shown
    // (persisted client-side) instead of fetching a random one — this
    // update to `query` re-triggers the effect below with that value.
    if (!restoredRef.current) {
      restoredRef.current = true;
      const stored = getStoredPlayer();
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted state from localStorage (an external system) on mount; re-triggers this effect with the restored value
        setInput(stored);
        setQuery(stored);
        return;
      }
    }

    let cancelled = false;
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
        // Persist whoever ended up being shown — random pick or search —
        // so the next page load restores this same player instead of
        // re-rolling a new random one.
        setStoredPlayer(res.player?.username ?? "");
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
          placeholder={t("searchPlaceholder")}
          className="w-full"
          trailingAction={{
            icon: <RefreshCw size={13} />,
            onClick: handleRefresh,
            label: t("refreshLabel"),
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
            <p className="text-sm text-red-600/70 dark:text-red-400/70">{t("loadError")}</p>
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

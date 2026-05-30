"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { UPCOMING_EVENTS } from "@/config/events";
import type { ServerEvent, EventCategory } from "@/config/events";

// Re-export types для обратной совместимости
export type { ServerEvent, EventCategory };

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EventTimelineProps {
    /**
     *   <EventTimeline />
     */
    events?: ServerEvent[];
    /**
     * @default true
     */
    showFilters?: boolean;
    /**
     * @default "all"
     */
    defaultFilter?: EventCategory | "all";
    /**
     * @default 10
     */
    maxVisible?: number;
    /**
     * @default false
     */
    hideHeader?: boolean;
    className?: string;
}

type FilterKey = "all" | EventCategory;

// ─── Static config ────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterKey; label: string; emoji: string }[] = [
    { key: "all", label: "Все", emoji: "📋" },
    { key: "pvp", label: "PvP", emoji: "⚔️" },
    { key: "world", label: "Мировые", emoji: "🌍" },
    { key: "pve", label: "PvE", emoji: "🐉" },
    { key: "economy", label: "Экономика", emoji: "💰" },
];

const CATEGORY_STYLE: Record<
    EventCategory,
    {
        accent: string;
        badgeBg: string;
        badgeBorder: string;
        badgeText: string;
        liveDot: string;
    }
> = {
    pvp: {
        accent: "#f472b6",
        badgeBg: "bg-pink-950/40",
        badgeBorder: "border-pink-600/30",
        badgeText: "text-pink-300",
        liveDot: "bg-pink-400",
    },
    world: {
        accent: "#34d399",
        badgeBg: "bg-emerald-950/40",
        badgeBorder: "border-emerald-600/30",
        badgeText: "text-emerald-300",
        liveDot: "bg-emerald-400",
    },
    pve: {
        accent: "#a78bfa",
        badgeBg: "bg-violet-950/40",
        badgeBorder: "border-violet-600/30",
        badgeText: "text-violet-300",
        liveDot: "bg-violet-400",
    },
    economy: {
        accent: "#d4a017",
        badgeBg: "bg-amber-950/40",
        badgeBorder: "border-amber-600/30",
        badgeText: "text-amber-300",
        liveDot: "bg-amber-400",
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCountdown(msUntil: number): string {
    const h = Math.floor(msUntil / 3_600_000);
    const m = Math.floor((msUntil % 3_600_000) / 60_000);
    const d = Math.floor(h / 24);
    const remainH = h % 24;

    if (d >= 30) {
        return new Date(Date.now() + msUntil).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }
    if (d >= 1) return remainH > 0 ? `${d} д ${remainH} ч` : `${d} д`;
    if (h > 0) return `${h} ч ${m} мин`;
    return `${m} мин`;
}

type EventStatus = "upcoming" | "live" | "past";

function normalizeMs(ts: number): number {
    return ts < 1_000_000_000_000 ? ts * 1000 : ts;
}

function getStatus(event: ServerEvent, now: number): EventStatus {
    const start = normalizeMs(event.startAt);
    const end = normalizeMs(event.endAt);
    if (now > end) return "past";
    if (now >= start) return "live";
    return "upcoming";
}

function sortEvents(events: ServerEvent[], now: number): ServerEvent[] {
    return [...events].sort((a, b) => {
        const order: Record<EventStatus, number> = { live: 0, upcoming: 1, past: 2 };
        const sa = getStatus(a, now);
        const sb = getStatus(b, now);
        if (order[sa] !== order[sb]) return order[sa] - order[sb];
        return a.startAt - b.startAt;
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LivePulse({ color }: { color: string }) {
    return (
        <span className="relative inline-flex h-1.5 w-1.5">
            <span
                className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                    color
                )}
            />
            <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", color)} />
        </span>
    );
}

function FilterTabs({
    active,
    onChange,
    counts,
}: {
    active: FilterKey;
    onChange: (key: FilterKey) => void;
    counts: Record<FilterKey, number>;
}) {
    return (
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
            {FILTER_TABS.map((tab) => {
                const isActive = active === tab.key;
                const count = counts[tab.key];
                return (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                            "transition-all duration-150 select-none",
                            isActive
                                ? "bg-gold-700/15 text-amber-100/80 border border-gold-700/30"
                                : "bg-transparent text-amber-100/35 border border-transparent",
                            !isActive && "hover:text-amber-100/55 hover:border-gold-800/20"
                        )}
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        <span className="text-sm leading-none">{tab.emoji}</span>
                        {tab.label}
                        {count > 0 && (
                            <span
                                className={cn(
                                    "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] tabular-nums",
                                    isActive
                                        ? "bg-gold-700/30 text-amber-100/70"
                                        : "bg-stone-800/60 text-amber-100/25"
                                )}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

function EventCard({ event, now }: { event: ServerEvent; now: number }) {
    const status = getStatus(event, now);
    const style = CATEGORY_STYLE[event.category];
    const msUntil = event.startAt - now;
    const isPast = status === "past";
    const isLive = status === "live";

    const Wrapper = event.href && !isPast ? "a" : "div";
    const wrapperProps =
        event.href && !isPast
            ? ({
                href: event.href,
                target: "_blank" as const,
                rel: "noopener noreferrer",
            } as const)
            : {};

    return (
        <Wrapper
            {...wrapperProps}
            className={cn(
                "group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-200",
                "border-gold-800/25 bg-stone-900/50",
                !isPast && "hover:border-gold-700/45 hover:bg-stone-900/70 cursor-pointer",
                isPast && "pointer-events-none select-none"
            )}
            style={{
                boxShadow: `inset 3px 0 0 0 ${isPast ? "#3d3d3d" : style.accent}`,
                textDecoration: "none",
            }}
        >
            <span className="mt-0.5 shrink-0 text-2xl leading-none select-none" aria-hidden>
                {event.emoji}
            </span>

            <div className="min-w-0 flex-1">
                <p
                    className="text-sm font-semibold text-amber-100/90 leading-5 mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    {event.name}
                </p>
                <p className="text-xs leading-relaxed text-amber-100/45 line-clamp-2">
                    {event.description}
                </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2 min-w-22.5">
                <span
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
                        "text-[10px] tracking-wide",
                        style.badgeBg,
                        style.badgeBorder,
                        style.badgeText
                    )}
                >
                    {event.categoryLabel}
                </span>

                {isLive && (
                    <span className="flex items-center gap-1.5 text-[11px] text-amber-100/55">
                        <LivePulse color={style.liveDot} />
                        Идёт сейчас
                    </span>
                )}
                {!isLive && !isPast && msUntil > 0 && (
                    <span className="flex items-center gap-1.5 text-[11px] text-amber-100/35">
                        До начала
                    </span>
                )}
                {isPast && (
                    <span className="flex items-center gap-1.5 text-[11px] text-amber-100/35">
                        Завершено
                    </span>
                )}

                {isLive && (
                    <span className="text-[11px] text-amber-100/35 tabular-nums text-right leading-4">
                        до {formatCountdown(normalizeMs(event.endAt) - now)}
                    </span>
                )}
                {!isLive && !isPast && msUntil > 0 && (
                    <span className="text-[11px] text-amber-100/35 tabular-nums text-right leading-4">
                        {formatCountdown(msUntil)}
                    </span>
                )}
                {isPast && (
                    <span className="text-[11px] text-amber-100/25 tabular-nums text-right leading-4">
                        {new Date(normalizeMs(event.endAt)).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </span>
                )}
            </div>
        </Wrapper>
    );
}

function EmptyState({ filter }: { filter: FilterKey }) {
    const tab = FILTER_TABS.find((t) => t.key === filter);
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-2 rounded-xl border border-dashed border-gold-800/15">
            <span className="text-2xl opacity-30">{tab?.emoji ?? "📭"}</span>
            <p className="text-xs text-amber-100/25">
                {filter === "all"
                    ? "Нет событий"
                    : `Нет событий в категории «${tab?.label}»`}
            </p>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EventTimeline({
    events,
    showFilters = true,
    defaultFilter = "all",
    maxVisible = 10,
    hideHeader = false,
    className,
}: EventTimelineProps) {
    const [now, setNow] = useState(() => Date.now());
    const [filter, setFilter] = useState<FilterKey>(defaultFilter);

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(id);
    }, []);

    const resolvedEvents: ServerEvent[] = Array.isArray(events) ? events : UPCOMING_EVENTS;
    const sorted = sortEvents(resolvedEvents, now);

    const counts = FILTER_TABS.reduce<Record<FilterKey, number>>((acc, tab) => {
        acc[tab.key] =
            tab.key === "all"
                ? sorted.filter((e) => getStatus(e, now) !== "past").length
                : sorted.filter(
                    (e) => e.category === tab.key && getStatus(e, now) !== "past"
                ).length;
        return acc;
    }, {} as Record<FilterKey, number>);

    const filtered =
        filter === "all" ? sorted : sorted.filter((e) => e.category === filter);

    const visible = filtered.slice(0, maxVisible);
    const overflow = filtered.length - maxVisible;

    return (
        <section className={cn("py-10 relative", className)}>
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-gold-700/20 to-transparent" />

            {!hideHeader && (
                <div className="flex items-baseline justify-between mb-6">
                    <div>
                        <p
                            className="text-[10px] tracking-[0.3em] uppercase text-gold-600/70 mb-2"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Ивенты
                        </p>
                        <h2
                            className="text-2xl text-amber-100/90"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Ближайшие события
                        </h2>
                    </div>
                    <span className="text-[10px] text-amber-100/25 hidden sm:block tabular-nums">
                        ↻ каждую минуту
                    </span>
                </div>
            )}

            {showFilters && (
                <FilterTabs active={filter} onChange={setFilter} counts={counts} />
            )}

            {visible.length === 0 ? (
                <EmptyState filter={filter} />
            ) : (
                <div className="flex flex-col gap-2.5">
                    {visible.map((ev) => (
                        <EventCard key={ev.id} event={ev} now={now} />
                    ))}
                </div>
            )}

            {overflow > 0 && (
                <p className="mt-4 text-center text-[11px] text-amber-100/25">
                    + ещё {overflow} {overflow === 1 ? "событие" : "события"} — смотрите в Discord
                </p>
            )}
        </section>
    );
}

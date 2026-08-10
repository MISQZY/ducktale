"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { UPCOMING_EVENTS, EVENT_CATEGORY_STYLE } from "@/config/events";
import type { ServerEvent, EventCategory } from "@/config/events";

// Re-export types для обратной совместимости
export type { ServerEvent, EventCategory };

type EventsT = ReturnType<typeof useTranslations>;

function dateLocale(locale: string): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}

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

const FILTER_TABS: { key: FilterKey; emoji: string }[] = [
    { key: "all", emoji: "📋" },
    { key: "pvp", emoji: "⚔️" },
    { key: "world", emoji: "🌍" },
    { key: "pve", emoji: "🐉" },
    { key: "economy", emoji: "💰" },
];

// CATEGORY_STYLE moved to @/config/events as EVENT_CATEGORY_STYLE (see import above).

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCountdown(msUntil: number, t: EventsT, locale: string): string {
    const h = Math.floor(msUntil / 3_600_000);
    const m = Math.floor((msUntil % 3_600_000) / 60_000);
    const d = Math.floor(h / 24);
    const remainH = h % 24;

    if (d >= 30) {
        return new Date(Date.now() + msUntil).toLocaleDateString(dateLocale(locale), {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }
    if (d >= 1) return remainH > 0 ? t("unit.daysHours", { days: d, hours: remainH }) : t("unit.days", { days: d });
    if (h > 0) return t("unit.hoursMinutes", { hours: h, minutes: m });
    return t("unit.minutes", { minutes: m });
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
    const t = useTranslations("Events");
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
                                ? "bg-primary/15 text-foreground/80 border border-primary/30"
                                : "bg-transparent text-foreground/35 border border-transparent",
                            !isActive && "hover:text-foreground/55 hover:border-primary/20"
                        )}
                        style={{ fontFamily: "var(--font-body)" }}
                    >
                        <span className="text-sm leading-none">{tab.emoji}</span>
                        {t(`categories.${tab.key}`)}
                        {count > 0 && (
                            <span
                                className={cn(
                                    "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] tabular-nums",
                                    isActive
                                        ? "bg-primary/30 text-foreground/70"
                                        : "bg-muted/60 text-foreground/25"
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
    const t = useTranslations("Events");
    const locale = useLocale();
    const status = getStatus(event, now);
    const style = EVENT_CATEGORY_STYLE[event.category];
    const msUntil = normalizeMs(event.startAt) - now;
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
                "border-primary/25 bg-card/50",
                !isPast && "hover:border-primary/45 hover:bg-card/70 cursor-pointer",
                isPast && "pointer-events-none select-none"
            )}
            style={{
                boxShadow: `inset 3px 0 0 0 ${isPast ? "var(--color-stone-600)" : style.accent}`,
                textDecoration: "none",
            }}
        >
            <span className="mt-0.5 shrink-0 text-2xl leading-none select-none" aria-hidden>
                {event.emoji}
            </span>

            <div className="min-w-0 flex-1">
                <p
                    className="text-sm font-semibold text-foreground/90 leading-5 mb-1"
                    style={{ fontFamily: "var(--font-body)" }}
                >
                    {t(`items.${event.id}.name`)}
                </p>
                <p className="text-xs leading-relaxed text-foreground/45 line-clamp-2">
                    {t(`items.${event.id}.description`)}
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
                    {t(`categories.${event.category}`)}
                </span>

                {isLive && (
                    <span className="flex items-center gap-1.5 text-[11px] text-foreground/55">
                        <LivePulse color={style.liveDot} />
                        {t("status.live")}
                    </span>
                )}
                {!isLive && !isPast && msUntil > 0 && (
                    <span className="flex items-center gap-1.5 text-[11px] text-foreground/35">
                        {t("status.upcoming")}
                    </span>
                )}
                {isPast && (
                    <span className="flex items-center gap-1.5 text-[11px] text-foreground/35">
                        {t("status.past")}
                    </span>
                )}

                {isLive && (
                    <span className="text-[11px] text-foreground/35 tabular-nums text-right leading-4">
                        {t("until", { time: formatCountdown(normalizeMs(event.endAt) - now, t, locale) })}
                    </span>
                )}
                {!isLive && !isPast && msUntil > 0 && (
                    <span className="text-[11px] text-foreground/35 tabular-nums text-right leading-4">
                        {formatCountdown(msUntil, t, locale)}
                    </span>
                )}
                {isPast && (
                    <span className="text-[11px] text-foreground/25 tabular-nums text-right leading-4">
                        {new Date(normalizeMs(event.endAt)).toLocaleDateString(dateLocale(locale), {
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
    const t = useTranslations("Events");
    const tab = FILTER_TABS.find((tab) => tab.key === filter);
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-2 rounded-xl border border-dashed border-primary/15">
            <span className="text-2xl opacity-30">{tab?.emoji ?? "📭"}</span>
            <p className="text-xs text-foreground/25">
                {filter === "all"
                    ? t("empty.all")
                    : t("empty.category", { category: t(`categories.${filter}`) })}
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
    const t = useTranslations("Events");
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
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />

            {!hideHeader && (
                <div className="flex items-baseline justify-between mb-6">
                    <div>
                        <p
                            className="text-[10px] tracking-[0.3em] uppercase text-primary/70 mb-2"
                            style={{ fontFamily: "var(--font-body)" }}
                        >
                            {t("eyebrow")}
                        </p>
                        <h2
                            className="text-2xl text-foreground/90"
                            style={{ fontFamily: "var(--font-body)" }}
                        >
                            {t("title")}
                        </h2>
                    </div>
                    <span className="text-[10px] text-foreground/25 hidden sm:block tabular-nums">
                        {t("refreshNote")}
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
                <p className="mt-4 text-center text-[11px] text-foreground/25">
                    {t("overflow", { count: overflow })}
                </p>
            )}
        </section>
    );
}

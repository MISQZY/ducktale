"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { GoldDivider } from "@/components/common/GoldDivider";
import { EVENT_CATEGORY_STYLE } from "@/config/events";
import type { ServerEvent, EventCategory } from "@/config/events";
import { SERVERS } from "@/config/servers";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { localizedName } from "@/lib/i18n-name";

export type { ServerEvent, EventCategory };

type EventsT = ReturnType<typeof useTranslations>;

function dateLocale(locale: string): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EventTimelineProps {
    /** Resolved server-side (resolveServerEvents(), src/lib/events.ts) and passed down by the /events page — this component has no data-fetching of its own. */
    events: ServerEvent[];
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

type CategoryFilterKey = "all" | EventCategory;
/** "network" isolates network-wide events (serverId: null) — a third state alongside "all" and a specific SERVERS[].id, not just "no server selected". */
type RealmFilterKey = "all" | "network" | string;

// ─── Static config ────────────────────────────────────────────────────────────

const CATEGORY_TABS: { key: CategoryFilterKey; emoji: string }[] = [
    { key: "all", emoji: "📋" },
    { key: "pvp", emoji: "⚔️" },
    { key: "world", emoji: "🌍" },
    { key: "pve", emoji: "🐉" },
    { key: "economy", emoji: "💰" },
];

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

function matchesRealm(event: ServerEvent, realm: RealmFilterKey): boolean {
    if (realm === "all") return true;
    if (realm === "network") return event.serverId === null;
    return event.serverId === realm;
}

/** null serverId (network-wide) resolves to null here too — EventCard renders nothing for it rather than a synthetic "Network-wide" tag, since the event card is already visually unscoped by default (a server tag is only useful to call out the exception). */
function resolveServerTag(serverId: string | null): { name: string; emoji: string } | null {
    if (!serverId) return null;
    const server = SERVERS.find((s) => s.id === serverId);
    return server ? { name: server.name, emoji: server.emoji } : null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RealmTabs({
    active,
    onChange,
    counts,
}: {
    active: RealmFilterKey;
    onChange: (key: RealmFilterKey) => void;
    counts: Record<string, number>;
}) {
    const t = useTranslations("Events");

    const pillClass = (isActive: boolean, activeExtra?: string) =>
        cn(
            "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 select-none",
            "tracking-wide",
            isActive
                ? activeExtra ?? "bg-primary/15 border-primary/40 text-primary/90"
                : "bg-transparent border-primary/12 text-foreground/40 hover:text-foreground/65 hover:border-primary/25"
        );

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3" role="tablist" aria-label={t("realms.groupLabel")}>
            <button
                onClick={() => onChange("all")}
                className={pillClass(active === "all")}
                style={{ fontFamily: "var(--font-body)" }}
            >
                <span aria-hidden="true">🗺️</span>
                {t("realms.all")}
            </button>
            {SERVERS.map((server) => (
                <button
                    key={server.id}
                    onClick={() => onChange(server.id)}
                    className={pillClass(active === server.id, cn(server.badge, "border-current/40"))}
                    style={{ fontFamily: "var(--font-body)" }}
                >
                    <span aria-hidden="true">{server.emoji}</span>
                    {server.name}
                    {counts[server.id] > 0 && (
                        <span className="font-mono text-[10px] tabular-nums opacity-60">{counts[server.id]}</span>
                    )}
                </button>
            ))}
            <button
                onClick={() => onChange("network")}
                className={pillClass(active === "network")}
                style={{ fontFamily: "var(--font-body)" }}
            >
                <span aria-hidden="true">🌐</span>
                {t("realms.network")}
                {counts.network > 0 && (
                    <span className="font-mono text-[10px] tabular-nums opacity-60">{counts.network}</span>
                )}
            </button>
        </div>
    );
}

function CategoryTabs({
    active,
    onChange,
    counts,
}: {
    active: CategoryFilterKey;
    onChange: (key: CategoryFilterKey) => void;
    counts: Record<CategoryFilterKey, number>;
}) {
    const t = useTranslations("Events");
    return (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-8">
            {CATEGORY_TABS.map((tab) => {
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
                                    "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-mono tabular-nums",
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

/** The chronicle-spine node marking one entry — icon ring colored by category, a pulsing halo while live, and (unless this is the last visible entry) a connecting rail down to the next node. Column height comes from the row's own flex stretch, not a fixed value, so the rail always reaches the next node regardless of how tall a card's description happens to be. */
function ChronicleNode({ event, now, isLast }: { event: ServerEvent; now: number; isLast: boolean }) {
    const status = getStatus(event, now);
    const style = EVENT_CATEGORY_STYLE[event.category];
    const isPast = status === "past";
    const isLive = status === "live";
    const ringColor = isPast ? "var(--color-stone-600)" : style.accent;

    return (
        <div className="relative flex flex-col items-center w-10 shrink-0">
            <div className="relative shrink-0">
                {isLive && (
                    <span
                        className="absolute inset-0 rounded-full animate-ping opacity-50"
                        style={{ backgroundColor: style.accent }}
                        aria-hidden="true"
                    />
                )}
                <span
                    className={cn(
                        "relative z-10 flex items-center justify-center size-10 rounded-full border-2 bg-card",
                        isPast ? "opacity-60" : "opacity-100"
                    )}
                    style={{ borderColor: ringColor, color: isPast ? "var(--color-text-faint)" : style.accent }}
                    aria-hidden="true"
                >
                    <BadgeIcon name={event.icon} size={17} />
                </span>
            </div>
            {!isLast && (
                <span
                    className="w-px flex-1 mt-1 bg-linear-to-b from-primary/25 via-primary/10 to-transparent"
                    aria-hidden="true"
                />
            )}
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
    const serverTag = resolveServerTag(event.serverId);

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
                "liquid-card group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 w-full",
                "border-primary/20 bg-card/45",
                !isPast && "hover:border-primary/40 hover:bg-card/65 cursor-pointer",
                isPast && "cursor-default opacity-75"
            )}
            style={{ textDecoration: "none" }}
        >
            <div className="min-w-0 flex-1">
                <p
                    className="text-sm font-semibold text-foreground/90 leading-5 mb-1 flex items-center flex-wrap gap-x-2 gap-y-1"
                    style={{ fontFamily: "var(--font-body)" }}
                >
                    {localizedName(event.name, locale)}
                    {serverTag && (
                        <span
                            title={serverTag.name}
                            className="inline-flex items-center gap-1 text-[10px] font-normal text-foreground/40 border border-primary/15 rounded-full px-1.5 py-0.5"
                        >
                            <span aria-hidden="true">{serverTag.emoji}</span>
                            {serverTag.name}
                        </span>
                    )}
                </p>
                <p className="text-xs leading-relaxed text-foreground/45 line-clamp-2">
                    {localizedName(event.description, locale)}
                </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2 min-w-22.5">
                <span
                    className={cn(
                        "liquid-badge inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
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
                    <span className="font-mono text-[11px] text-foreground/35 tabular-nums text-right leading-4">
                        {t("until", { time: formatCountdown(normalizeMs(event.endAt) - now, t, locale) })}
                    </span>
                )}
                {!isLive && !isPast && msUntil > 0 && (
                    <span className="font-mono text-[11px] text-foreground/35 tabular-nums text-right leading-4">
                        {formatCountdown(msUntil, t, locale)}
                    </span>
                )}
                {isPast && (
                    <span className="font-mono text-[11px] text-foreground/25 tabular-nums text-right leading-4">
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

function EmptyState({ filter }: { filter: CategoryFilterKey }) {
    const t = useTranslations("Events");
    const tab = CATEGORY_TABS.find((tab) => tab.key === filter);
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
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>(defaultFilter);
    const [realmFilter, setRealmFilter] = useState<RealmFilterKey>("all");

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 10 * 60_000);
        return () => clearInterval(id);
    }, []);

    const sorted = sortEvents(events, now);
    const activeSorted = sorted.filter((e) => getStatus(e, now) !== "past");

    const categoryCounts = CATEGORY_TABS.reduce<Record<CategoryFilterKey, number>>((acc, tab) => {
        const base = realmFilter === "all" ? activeSorted : activeSorted.filter((e) => matchesRealm(e, realmFilter));
        acc[tab.key] = tab.key === "all" ? base.length : base.filter((e) => e.category === tab.key).length;
        return acc;
    }, {} as Record<CategoryFilterKey, number>);

    const realmCounts: Record<string, number> = { network: activeSorted.filter((e) => e.serverId === null).length };
    for (const server of SERVERS) {
        realmCounts[server.id] = activeSorted.filter((e) => e.serverId === server.id).length;
    }

    const filtered = sorted
        .filter((e) => categoryFilter === "all" || e.category === categoryFilter)
        .filter((e) => matchesRealm(e, realmFilter));

    const visible = filtered.slice(0, maxVisible);
    const overflow = filtered.length - maxVisible;

    return (
        <section className={cn("py-10 relative", className)}>
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />

            {!hideHeader && (
                <div className="text-center mb-8">
                    <p
                        className="text-[10px] tracking-[0.4em] uppercase text-primary/60 mb-3 flex items-center justify-center gap-3"
                        style={{ fontFamily: "var(--font-body)" }}
                    >
                        <span className="h-px w-6 bg-linear-to-r from-transparent to-primary/40 inline-block" />
                        {t("eyebrow")}
                        <span className="h-px w-6 bg-linear-to-l from-transparent to-primary/40 inline-block" />
                    </p>
                    <h1
                        className="text-3xl md:text-4xl text-primary/90 mb-4 leading-tight"
                        style={{ fontFamily: "var(--font-body)" }}
                    >
                        {t("title")}
                    </h1>
                    <GoldDivider wide className="mb-5" />
                    <p className="text-foreground/50 max-w-lg mx-auto leading-relaxed text-sm">
                        {t("description")}
                    </p>
                </div>
            )}

            {showFilters && (
                <>
                    <RealmTabs active={realmFilter} onChange={setRealmFilter} counts={realmCounts} />
                    <CategoryTabs active={categoryFilter} onChange={setCategoryFilter} counts={categoryCounts} />
                </>
            )}

            {visible.length === 0 ? (
                <EmptyState filter={categoryFilter} />
            ) : (
                <div className="flex flex-col">
                    {visible.map((ev, i) => (
                        <div key={ev.id} className="flex gap-4 pb-4">
                            <ChronicleNode event={ev} now={now} isLast={i === visible.length - 1} />
                            <div className="flex-1 min-w-0 flex items-center">
                                <EventCard event={ev} now={now} />
                            </div>
                        </div>
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

"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Clock, LogIn, VenusAndMars, Sprout, CircleCheck, XCircle, Castle, Flag, BadgeCheck, AlertCircle, RefreshCw, Unlink2,
} from "lucide-react";
import { DuckCard, DuckCardContent } from "@/components/ui/duck/card";
import { buttonVariants } from "@/components/ui/button";
import { SkinFace } from "@/components/common/SkinFace";
import { formatDurationMs, formatLastSeen } from "@/lib/player-card-format";
import { RESIDENT_ROLE_COLOR } from "@/lib/towny";
import { NETWORK_SERVERS } from "@/config/servers";
import { RankBadge } from "@/components/leaderboard/RankBadge";
import { unlinkAccount } from "@/lib/actions/account-link";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { GrowthStatus, PlayerCard as PlayerCardData, PlayerCardResponse, PlayerServerStatus } from "@/types/player-card";
import type { ResidentRole } from "@/types/towny";

type PlayerCardT = ReturnType<typeof useTranslations>;

// ─── General-info block ────────────────────────────────────────────────────────

function GeneralStat({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/60 border border-border/40 px-3 py-3 text-center">
      <Icon size={15} className="text-primary/60" />
      <span className="text-foreground/40 text-[11px] uppercase tracking-wide">{label}</span>
      <span className="text-foreground/90 text-sm font-medium">{children}</span>
    </div>
  );
}

function GrowthValue({ growth, t }: { growth: GrowthStatus; t: PlayerCardT }) {
  if (growth.state === "unknown") return <>{t("noData")}</>;
  if (growth.state === "complete") return <span className="text-emerald-700 dark:text-emerald-400">{t("growth.complete")}</span>;
  return <>{formatDurationMs(growth.secondsRemaining * 1000, t)}</>;
}

function LastLoginValue({ online, lastSeenMs, locale, t }: { online: boolean; lastSeenMs: number; locale: string; t: PlayerCardT }) {
  if (online) return <span className="text-emerald-600 dark:text-emerald-400">{t("online")}</span>;
  if (!lastSeenMs) return <>{t("noData")}</>;
  return <>{formatLastSeen(lastSeenMs, locale)}</>;
}

// ─── Per-server card ────────────────────────────────────────────────────────────

function ServerStatusCard({ status, t }: { status: PlayerServerStatus; t: PlayerCardT }) {
  const config = NETWORK_SERVERS.find((s) => s.id === status.serverId);
  if (!config) return null;

  return (
    <div className={cn("rounded-xl border p-4 bg-linear-to-br", config.color, config.border)}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-muted border border-border/60 flex items-center justify-center text-base shrink-0">
          {config.emoji}
        </div>
        <span
          className="text-sm text-foreground/90 font-medium"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {config.name}
        </span>
        {status.online && (
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-400 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {t("online")}
          </span>
        )}
      </div>

      <div className={cn(
        "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full mb-2.5",
        status.whitelisted ? "bg-emerald-900/40 text-emerald-300" : "bg-muted text-foreground/40"
      )}>
        {status.whitelisted ? <CircleCheck size={12} /> : <XCircle size={12} />}
        {status.whitelisted ? t("whitelistedYes") : t("whitelistedNo")}
      </div>

      {status.city && (
        <div className="flex flex-col gap-1 text-xs text-foreground/60">
          <span className="flex items-center gap-1.5">
            <Castle size={12} className="text-primary/60 shrink-0" />
            {status.city}
            {status.role && (
              <span className={cn("ml-1", RESIDENT_ROLE_COLOR[status.role as Exclude<ResidentRole, null>])}>
                <BadgeCheck size={11} className="inline mr-0.5 -mt-0.5" />
                {t(`role.${status.role}`)}
              </span>
            )}
          </span>
          {status.nation && (
            <span className="flex items-center gap-1.5">
              <Flag size={12} className="text-primary/60 shrink-0" />
              {status.nation}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Owner-only relink/unlink controls ──────────────────────────────────────────

const iconButtonClasses = cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "bg-card/70 backdrop-blur-sm");

/** Relink navigates to the /account/link flow; unlink calls the same server action the old dashboard "Minecraft account" card used, then refreshes so the server-rendered link status (and this card's visibility) catches up. */
function ManageActions({ lang, t }: { lang: string; t: PlayerCardT }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleUnlink() {
    setPending(true);
    try {
      await unlinkAccount(lang);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
      <Link href="/account/link" className={iconButtonClasses} aria-label={t("relinkAction")} title={t("relinkAction")}>
        <RefreshCw size={14} />
      </Link>
      <button
        type="button"
        onClick={handleUnlink}
        disabled={pending}
        className={cn(iconButtonClasses, "hover:text-destructive hover:border-destructive/40")}
        aria-label={t("unlinkAction")}
        title={t("unlinkAction")}
      >
        <Unlink2 size={14} />
      </button>
    </div>
  );
}

// ─── Loading / error states ─────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <DuckCard className="border-primary/20 bg-duck-stone/40 min-h-64">
      <DuckCardContent className="pt-5 flex flex-col items-center gap-3 animate-pulse">
        <div className="rounded-xl bg-muted" style={{ width: 96, height: 96 }} />
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="w-full grid grid-cols-2 gap-3 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
      </DuckCardContent>
    </DuckCard>
  );
}

function ErrorCard({ t, manage }: { t: PlayerCardT; manage?: { lang: string } }) {
  return (
    <DuckCard className="border-red-900/30 bg-duck-stone/40">
      {manage && <ManageActions lang={manage.lang} t={t} />}
      <DuckCardContent className="flex items-center gap-3 py-6 justify-center text-center">
        <AlertCircle size={18} className="text-red-600/70 dark:text-red-400/70 shrink-0" />
        <p className="text-sm text-red-600/70 dark:text-red-400/70">{t("loadError")}</p>
      </DuckCardContent>
    </DuckCard>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProfilePlayerCardProps {
  minecraftName: string;
  className?: string;
  /** Only passed from the signed-in user's own dashboard — renders the
   * relink/unlink icon buttons in the card's top-right corner. Omitted
   * entirely on public profile views of other users. */
  manage?: { lang: string };
}

/**
 * The account dashboard's "this is you" card — head + nickname title,
 * network-wide general stats, then one card per server with that server's
 * own whitelist status (and Towny city/nation where tracked).
 */
export function ProfilePlayerCard({ minecraftName, className, manage }: ProfilePlayerCardProps) {
  const t = useTranslations("PlayerCard");
  const locale = useLocale();
  const [player, setPlayer] = useState<PlayerCardData | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // No setStatus("loading") reset here: initial state already is
    // "loading", and minecraftName is a stable prop in this component's one
    // real usage (the dashboard), so this effect only ever runs once.
    let cancelled = false;

    fetch(`/api/player-card?search=${encodeURIComponent(minecraftName)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res: PlayerCardResponse) => {
        if (cancelled) return;
        setPlayer(res.player);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => { cancelled = true; };
  }, [minecraftName]);

  if (status === "loading") return <SkeletonCard />;
  if (status === "error" || !player) return <ErrorCard t={t} manage={manage} />;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <DuckCard className="border-primary/20 bg-duck-stone/40">
        {manage && <ManageActions lang={manage.lang} t={t} />}
        <DuckCardContent className="pt-5 flex flex-col items-center text-center gap-3">
          <SkinFace skinUrl={player.skinUrl} size={96} />

          <h2
            className="text-2xl font-bold text-foreground leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {player.username}
          </h2>
          {player.nickname && player.nickname !== player.username && (
            <p className="text-foreground/40 text-sm -mt-1.5">{player.nickname}</p>
          )}

          <p className="text-foreground/35 text-[11px] uppercase tracking-widest mt-1">
            {t("generalTitle")}
          </p>
          <div className="w-full grid grid-cols-2 gap-2.5">
            <GeneralStat icon={LogIn} label={t("labels.lastLogin")}>
              <LastLoginValue online={player.online} lastSeenMs={player.lastSeenMs} locale={locale} t={t} />
            </GeneralStat>
            <GeneralStat icon={Clock} label={t("labels.playtime")}>
              <span className="inline-flex items-center gap-1.5">
                {formatDurationMs(player.playtimeMs, t)}
                {player.rank !== null && (
                  <RankBadge rank={player.rank} size={13} title={t("rankTooltip", { rank: player.rank })} />
                )}
              </span>
            </GeneralStat>
            <GeneralStat icon={VenusAndMars} label={t("labels.gender")}>
              {player.gender ? t(`gender.${player.gender}`) : t("noData")}
            </GeneralStat>
            <GeneralStat icon={Sprout} label={t("labels.growth")}>
              <GrowthValue growth={player.growth} t={t} />
            </GeneralStat>
          </div>
        </DuckCardContent>
      </DuckCard>

      <div>
        <p className="text-foreground/35 text-[11px] uppercase tracking-widest mb-2.5">
          {t("serversTitle")}
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {player.servers.map((s) => (
            <ServerStatusCard key={s.serverId} status={s} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

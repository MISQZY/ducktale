import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  Clock, LogIn, VenusAndMars, Sprout, CircleCheck, XCircle, Castle, Flag, BadgeCheck, AlertCircle, Settings,
} from "lucide-react";
import { DuckCard, DuckCardContent } from "@/components/ui/duck/card";
import { SkinFace } from "@/components/common/SkinFace";
import { RoleBadgeChip } from "@/components/badges/RoleBadgeChip";
import { formatDurationMs, formatLastSeen } from "@/lib/player-card-format";
import { RESIDENT_ROLE_COLOR } from "@/lib/towny";
import { NETWORK_SERVERS } from "@/config/servers";
import { RankBadge } from "@/components/leaderboard/RankBadge";
import { getPlayerCard } from "@/lib/player-card";
import { cn } from "@/lib/utils";
import type { GrowthStatus, PlayerServerStatus } from "@/types/player-card";
import type { ResidentRole } from "@/types/towny";

type PlayerCardT = Awaited<ReturnType<typeof getTranslations>>;

// ─── General-info block ────────────────────────────────────────────────────────

function GeneralStat({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div suppressHydrationWarning className="liquid-card flex flex-col items-center gap-0.5 rounded-lg bg-muted/60 border border-border/40 px-3 py-2 text-center">
      <Icon size={15} className="text-primary/60" />
      <span className="text-foreground/40 text-[11px] uppercase tracking-wide">{label}</span>
      <span className="text-foreground/90 text-sm font-medium">{children}</span>
    </div>
  );
}

function GrowthValue({ growth, t }: { growth: GrowthStatus; t: PlayerCardT }) {
  if (growth.state === "unknown") return <>{t("noData")}</>;

  const heightText = growth.heightMeters !== null
    ? t("growth.height", { height: growth.heightMeters.toFixed(2) })
    : null;

  if (growth.state === "complete") {
    return (
      <span className="flex flex-col items-center leading-tight gap-0.5">
        <span className="text-emerald-700 dark:text-emerald-400">{t("growth.complete")}</span>
        {heightText && <span className="text-foreground/45 text-[11px]">{heightText}</span>}
      </span>
    );
  }

  return (
    <span className="flex flex-col items-center leading-tight gap-0.5">
      <span>
        {t("growth.timeWithPercent", {
          time: formatDurationMs(growth.secondsRemaining * 1000, t),
          percent: growth.percent,
        })}
      </span>
      {heightText && <span className="text-foreground/45 text-[11px]">{heightText}</span>}
    </span>
  );
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
    <div
      className={cn(
        "liquid-card shrink-0 snap-start w-44 rounded-xl border p-4 bg-linear-to-br flex flex-col items-center text-center gap-2.5 relative",
        config.color, config.border,
        status.maintenanceEnabled ? "animate-border-glow" : (status.online && "animate-border-glow-green")
      )}
      suppressHydrationWarning
    >
      {status.maintenanceEnabled && (
        <div className="absolute top-2 right-2 text-yellow-500/80">
          <Settings size={14} className="animate-[spin_4s_linear_infinite]" />
        </div>
      )}
      <div className="w-10 h-10 rounded-lg bg-muted border border-border/60 flex items-center justify-center text-lg shrink-0">
        {config.emoji}
      </div>

      <span
        className="text-sm text-foreground/90 font-medium leading-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {config.name}
      </span>

      {status.whitelistEnabled && (
        <div className={cn(
          "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full",
          status.whitelisted ? "bg-emerald-900/40 text-emerald-300" : "bg-muted text-foreground/40"
        )}>
          {status.whitelisted ? <CircleCheck size={12} /> : <XCircle size={12} />}
          {status.whitelisted ? t("whitelistedYes") : t("whitelistedNo")}
        </div>
      )}

      {status.city && (
        <div className="flex flex-col items-center gap-1 text-xs text-foreground/60 pt-2 mt-1 border-t border-border/30 w-full">
          <span className="flex items-center gap-1.5">
            <Castle size={12} className="text-primary/60 shrink-0" />
            {status.city}
          </span>
          {status.role && (
            <span className={cn("flex items-center gap-1", RESIDENT_ROLE_COLOR[status.role as Exclude<ResidentRole, null>])}>
              <BadgeCheck size={11} />
              {t(`role.${status.role}`)}
            </span>
          )}
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

function ErrorCard({ t }: { t: PlayerCardT }) {
  return (
    <DuckCard className="border-red-900/30 bg-duck-stone/40">
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
  /** Locale for date/duration formatting — passed explicitly since this is a
   * Server Component (no useLocale() hook to read it from). */
  locale: string;
  /** Pre-formatted "member since" text — only the public profile page
   * passes this, rendered right under the nickname line. Pre-formatted
   * (rather than a raw Date) since the locale/wording belongs to that
   * page's own "Profile" i18n namespace, not this component's "PlayerCard" one. */
  registeredLabel?: string;
  /** Optional slot to render the badges block between the main card and the servers list. */
  badgesNode?: React.ReactNode;
}

/**
 * The account dashboard's "this is you" card — head + nickname title,
 * network-wide general stats, then one card per server with that server's
 * own whitelist status (and Towny city/nation where tracked).
 *
 * A plain Server Component wrapping an async one in <Suspense>: the data
 * fetch (getPlayerCard, shared with /api/player-card so this needs no HTTP
 * round trip of its own) streams in behind SkeletonCard instead of blocking
 * the rest of the page, and instead of a client-side fetch-after-mount.
 * Relink/unlink controls live in ProfileQuickActions (top of /profile), not here.
 */
export function ProfilePlayerCard(props: ProfilePlayerCardProps) {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <ProfilePlayerCardContent {...props} />
    </Suspense>
  );
}

async function ProfilePlayerCardContent({ minecraftName, className, locale, registeredLabel, badgesNode }: ProfilePlayerCardProps) {
  const t = await getTranslations("PlayerCard");
  const player = await getPlayerCard(minecraftName);

  if (!player) return <ErrorCard t={t} />;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <DuckCard
        className="border-primary/20 bg-duck-stone/40"
        // The player's chat-color as a background-image layered over the
        // card's own bg-duck-stone/40 background-color, not a separate
        // opaque div — a flat rectangle on top fought the liquid-card glass
        // effect (backdrop-blur showing through a translucent background)
        // instead of blending into it. Each stop goes through color-mix so
        // the gradient itself is translucent — the same technique
        // .liquid-card.bg-card already uses for its own tint — letting the
        // blurred backdrop and bg-duck-stone/40 both still show through.
        // Degenerate 2-stop gradient (same color twice) for the solid case
        // keeps this to one code path instead of branching between
        // background-color and background-image.
        style={player.nameColor ? {
          backgroundImage: `linear-gradient(135deg, ${
            (player.nameColor.type === "gradient" ? player.nameColor.stops : [player.nameColor.color, player.nameColor.color])
              .map((hex) => `color-mix(in srgb, ${hex} 18%, transparent)`)
              .join(", ")
          })`,
        } : undefined}
      >
        <DuckCardContent className="pt-4 flex flex-col items-center text-center gap-2">
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
          {player.roles.length > 0 && (
            <div className="flex items-center gap-2">
              {player.roles.map((role) => (
                <RoleBadgeChip key={role.trackKey} name={role.name} icon={role.icon} color={role.color} size={18} />
              ))}
            </div>
          )}
          {registeredLabel && (
            <p className="text-foreground/35 text-xs -mt-1">{registeredLabel}</p>
          )}

          <p className="text-foreground/35 text-[11px] uppercase tracking-widest mt-1">
            {t("generalTitle")}
          </p>
          <div className="w-full grid grid-cols-2 gap-2 mt-1">
            <GeneralStat icon={LogIn} label={t("labels.lastLogin")}>
              <LastLoginValue online={player.online} lastSeenMs={player.lastSeenMs} locale={locale} t={t} />
            </GeneralStat>
            <GeneralStat icon={Clock} label={t("labels.playtime")}>
              <span className="inline-flex items-center gap-1.5">
                {formatDurationMs(player.playtimeMs, t)}
                {player.rank !== null && (
                  <RankBadge rank={player.rank} size={16} className="relative top-[1px]" title={t("rankTooltip", { rank: player.rank })} />
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

      {badgesNode && (
        <div className="mt-1">
          {badgesNode}
        </div>
      )}

      <div>
        <p className="text-foreground/35 text-[11px] uppercase tracking-widest mb-2.5 text-center">
          {t("serversTitle")}
        </p>
        <div className="flex justify-center-safe gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
          {player.servers.map((s) => (
            <ServerStatusCard key={s.serverId} status={s} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

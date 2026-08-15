"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SOCIALS } from "@/config/site";
import { EXTERNAL_APIS } from "@/config/external-apis";
import { SOCIAL_ICON_MAP } from "@/components/ui/social-icons";
import SectionHeader from "@/components/SectionHeader";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getShowcasePlayers } from "@/lib/actions/showcase";
import { nameColorStyle } from "@/lib/name-color";
import type { PlayerColor } from "@/types/player-card";

/** Corner ornament positioned at one of the four card corners. */
function CornerOrnament({
  pos,
  borderClass,
}: {
  pos: "tl" | "tr" | "bl" | "br";
  borderClass: string;
}) {
  return (
    <span
      className={cn(
        "absolute w-3 h-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        borderClass,
        pos === "tl" && "top-1.5 left-1.5 border-t border-l rounded-tl-lg",
        pos === "tr" && "top-1.5 right-1.5 border-t border-r rounded-tr-lg",
        pos === "bl" && "bottom-1.5 left-1.5 border-b border-l rounded-bl-lg",
        pos === "br" && "bottom-1.5 right-1.5 border-b border-r rounded-br-lg"
      )}
    />
  );
}

const CORNERS = ["tl", "tr", "bl", "br"] as const;

const SKELETON_COUNT = 10;

interface ShowcasePlayer {
  name: string;
  skinUrl: string | null;
  profileUsername?: string | null;
  nameColor?: PlayerColor | null;
}

export default function SocialSection() {
  const t = useTranslations("Social");

  const [players, setPlayers] = useState<ShowcasePlayer[] | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    getShowcasePlayers().then((data) => {
      if (!active) return;
      if (data.players && data.players.length > 0) {
        // Shuffle the players on the client so it's different on every page refresh
        // even though the underlying data is cached for 12 hours
        const shuffled = [...data.players].sort(() => 0.5 - Math.random());
        setPlayers(shuffled);
      }
      setTotalPlayers(Math.floor(data.total / 100) * 100);
    });
    return () => { active = false; };
  }, []);

  const MARQUEE_PLAYERS = players ? [...players, ...players] : [];

  return (
    <section id="community" className="py-16 px-6 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <SectionHeader
          label={t("label")}
          title={t("title")}
          description={t("description")}
        />

        {/* Player Marquee */}
        <div className="relative flex w-full overflow-hidden mt-6 mb-8 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          {players === null ? (
            <div className="flex w-full items-center gap-4 py-2">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <Skeleton key={i} className="h-[60px] w-40 rounded-lg shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex w-max animate-marquee items-center gap-4 py-2 hover:[animation-play-state:paused]">
              {MARQUEE_PLAYERS.map((p, i) => {
                const hasProfile = Boolean(p.profileUsername);
                return (
                  <PlayerAvatar
                    key={`${p.name}-${i}`}
                    name={p.profileUsername ?? p.name}
                    skinUrl={p.skinUrl || EXTERNAL_APIS.legacy_skin.skinUrl(p.name)}
                    avatarSize={40}
                    hasSiteProfile={hasProfile}
                    linked={hasProfile}
                    avatarClassName="rounded-md border-none"
                    growName={false}
                    className={cn(
                      "relative overflow-hidden rounded-lg bg-card/70 py-2 px-2 shadow-sm shrink-0 transition-transform duration-300 hover:scale-105",
                      hasProfile ? "border-2 border-primary/60 hover:border-primary" : "border border-primary/25"
                    )}
                    style={nameColorStyle(p.nameColor)}
                    nameNode={
                      <span
                        title={p.name}
                        className={cn(
                          "text-base tracking-wide whitespace-nowrap",
                          hasProfile ? "font-bold text-amber-500 dark:text-amber-400" : "font-semibold text-foreground/90"
                        )}
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {p.name}
                      </span>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Visitor Stats */}
        <p
          className="text-center text-foreground/50 text-sm mb-10"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("playersVisited", { count: totalPlayers !== null ? totalPlayers.toString() : "1000+" })}
        </p>

        {/* Social Cards (Small & Centered) */}
        <div className="flex flex-wrap justify-center items-center gap-4">
          {SOCIALS.map((social) => {
            const Icon = SOCIAL_ICON_MAP[social.id];
            return (
              <Link
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "liquid-card group relative flex flex-row items-center gap-3 rounded-xl border px-4 py-3 min-w-[200px]",
                  "transition-all duration-300",
                  "hover:-translate-y-1 hover:scale-[1.02]",
                  social.color.bg,
                  social.color.border,
                  "hover:border-opacity-60"
                )}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.setProperty(
                    "box-shadow",
                    `0 8px 32px ${social.color.glow}, 0 4px 30px rgba(0,0,0,0.5), 0 1px 0 rgba(212,160,23,0.04)`,
                    "important"
                  );
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.removeProperty("box-shadow");
                }}
              >
                {CORNERS.map((pos) => (
                  <CornerOrnament key={pos} pos={pos} borderClass={social.color.border} />
                ))}

                <div
                  className={cn(
                    "w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border",
                    "transition-all duration-300 group-hover:scale-110",
                    social.color.bg,
                    social.color.border
                  )}
                >
                  {Icon && <Icon className={cn("w-5 h-5", social.color.icon)} />}
                </div>

                <div className="flex flex-col text-left">
                  <p
                    className="text-foreground/90 font-semibold text-sm tracking-wide"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {social.label}
                  </p>
                  <p
                    className="text-foreground/45 text-xs mt-0.5"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {t(`items.${social.id}.sublabel`)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

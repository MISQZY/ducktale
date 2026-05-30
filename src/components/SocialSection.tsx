"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SOCIALS } from "@/config/site";
import { SOCIAL_ICON_MAP } from "@/components/ui/social-icons";
import SectionHeader from "@/components/SectionHeader";

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

export default function SocialSection() {
  return (
    <section id="community" className="py-28 px-6 relative">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-gold-700/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <SectionHeader
          label="Сообщество"
          title="Мы в соцсетях"
          description="Вступай в наши каналы — следи за новостями, участвуй в ивентах и общайся с другими игроками."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {SOCIALS.map((social) => {
            const Icon = SOCIAL_ICON_MAP[social.id];
            return (
              <Link
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group relative flex flex-col items-center gap-3 rounded-2xl border px-6 py-8",
                  "transition-all duration-300",
                  "hover:-translate-y-1 hover:scale-[1.02]",
                  social.color.bg,
                  social.color.border,
                  "hover:border-opacity-60"
                )}
                style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.4)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    `0 8px 32px ${social.color.glow}, 0 2px 20px rgba(0,0,0,0.5)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 2px 20px rgba(0,0,0,0.4)";
                }}
              >
                {CORNERS.map((pos) => (
                  <CornerOrnament key={pos} pos={pos} borderClass={social.color.border} />
                ))}

                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                    "transition-all duration-300 group-hover:scale-110",
                    social.color.bg,
                    social.color.border
                  )}
                >
                  {Icon && <Icon className={cn("w-5 h-5", social.color.icon)} />}
                </div>

                <div className="text-center">
                  <p
                    className="text-amber-100/90 font-semibold text-sm tracking-wide mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {social.label}
                  </p>
                  <p
                    className="text-amber-100/35 text-xs"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {social.sublabel}
                  </p>
                </div>

                <span
                  className={cn(
                    "text-xs opacity-0 group-hover:opacity-70 transition-opacity duration-300 mt-1",
                    social.color.icon
                  )}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem" }}
                >
                  Перейти →
                </span>
              </Link>
            );
          })}
        </div>

        <p
          className="text-center text-amber-100/20 text-xs mt-10 tracking-wider"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ✦ &nbsp; Присоединяйся, с нами весело &nbsp; ✦
        </p>
      </div>
    </section>
  );
}

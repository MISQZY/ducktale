"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Sword } from "lucide-react";
import { SERVERS, NETWORK_HOST } from "@/config/servers";
import { ServerAddress } from "@/components/docs/ServerAddress";
import SectionHeader from "@/components/SectionHeader";
import ServerStatusBadge from "./ServerStatusBadge";
import { cn } from "@/lib/utils";


export default function ServersSection() {
  const t = useTranslations("Servers");

  return (
    <section id="servers" className="py-16 px-6 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        <SectionHeader label={t("label")} title={t("title")} />
        <div className="grid md:grid-cols-2 gap-6">
          {SERVERS.map((server) => {
            return (
              <div
                key={server.id}
                className={cn(
                  "relative rounded-2xl border p-8 transition-all duration-300 group",
                  server.border,
                  "bg-linear-to-br",
                  server.color,
                  server.glow,
                  "hover:shadow-2xl"
                )}
              >
                <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-primary/70 z-10 rounded-tl-2xl pointer-events-none" />
                <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-primary/70 z-10 rounded-br-2xl pointer-events-none" />
                <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-15" />

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted border border-border/60 flex items-center justify-center text-3xl
                                    group-hover:scale-105 transition-transform duration-300">
                      {server.emoji}
                    </div>
                    <div>
                      <h3
                        className="text-2xl text-primary leading-none mb-1.5"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {server.name}
                      </h3>
                      <span className={cn("text-xs px-2.5 py-0.5 rounded-full", server.badge)}>
                        {t(`items.${server.id}.tagline`)}
                      </span>
                    </div>
                  </div>

                  <ServerStatusBadge host={server.host} />
                </div>

                <p className="text-foreground/65 leading-relaxed mb-6 text-sm">
                  {t(`items.${server.id}.description`)}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {t.raw(`items.${server.id}.features`).map((f: string) => (
                    <span
                      key={f}
                      className="text-xs px-2.5 py-1 rounded-md bg-muted text-foreground/55 border border-border/40
                                 group-hover:border-border/70 transition-colors
                                 hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <Link
                  href={server.href}
                  className="flex items-center justify-between w-full px-5 py-3 rounded-xl
                             border border-primary/25 hover:border-primary/55
                             bg-primary/4 hover:bg-primary/9
                             text-primary/80 hover:text-primary
                             transition-all duration-200 group/btn"
                >
                  <span className="text-sm font-medium tracking-wide"
                    style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem" }}>
                    {t("detailsCta")}
                  </span>
                  <ArrowRight
                    size={15}
                    className="group-hover/btn:translate-x-1 transition-transform duration-200"
                  />
                </Link>
              </div>
            );
          })}
        </div>

        <div
          id="connect"
          className="mt-12 rounded-2xl border border-primary/18 bg-card/55 p-8 text-center relative overflow-hidden"
        >
          <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-primary/20" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-primary/20" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-primary/20" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-primary/20" />

          <div className="flex items-center justify-center gap-2 mb-4">
            <Sword size={12} className="text-primary/40 rotate-45" />
            <p className="text-foreground/40 text-xs tracking-[0.35em] uppercase">
              {t("connect.label")}
            </p>
            <Sword size={12} className="text-primary/40 -rotate-135" />
          </div>

          <ServerAddress server="network" align="center" />
        </div>
      </div>
    </section>
  );
}

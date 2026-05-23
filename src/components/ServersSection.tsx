"use client";

import Link from "next/link";
import { ArrowRight, Sword } from "lucide-react";
import { SERVERS, NETWORK_HOST } from "@/config/servers";
import CopyToClipboard from "./ui/CopyToClipboard";
import SectionHeader from "@/components/SectionHeader";
import ServerStatusBadge from "./ServerStatusBadge";
import { cn } from "@/lib/utils";


export default function ServersSection() {
  return (
    <section id="servers" className="py-28 px-6 relative">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-gold-700/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <SectionHeader label="Наши серверы" title="Выбери свой мир" />
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
                <div className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-gold-400/70 z-10 rounded-tl-2xl pointer-events-none" />
                <div className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-gold-400/70 z-10 rounded-br-2xl pointer-events-none" />
                <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-15" />

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-black/30 border border-white/8 flex items-center justify-center text-3xl
                                    group-hover:scale-105 transition-transform duration-300">
                      {server.emoji}
                    </div>
                    <div>
                      <h3
                        className="text-2xl text-amber-100 leading-none mb-1.5"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {server.name}
                      </h3>
                      <span className={cn("text-xs px-2.5 py-0.5 rounded-full", server.badge)}>
                        {server.tagline}
                      </span>
                    </div>
                  </div>

                  <ServerStatusBadge host={server.host} />
                </div>

                <p className="text-amber-100/65 leading-relaxed mb-6 text-sm">
                  {server.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {server.features.map((f) => (
                    <span
                      key={f}
                      className="text-xs px-2.5 py-1 rounded-md bg-black/25 text-amber-100/55 border border-white/5
                                 group-hover:border-white/8 transition-colors"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <Link
                  href={server.href}
                  className="flex items-center justify-between w-full px-5 py-3 rounded-xl
                             border border-gold-500/25 hover:border-gold-500/55
                             bg-gold-500/4 hover:bg-gold-500/9
                             text-gold-300/80 hover:text-gold-200
                             transition-all duration-200 group/btn"
                >
                  <span className="text-sm font-medium tracking-wide"
                    style={{ fontFamily: "var(--font-display)", fontSize: "0.78rem" }}>
                    Подробнее
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
          className="mt-12 rounded-2xl border border-gold-700/18 bg-stone-900/55 p-8 text-center relative overflow-hidden"
        >
          <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-gold-600/20" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-gold-600/20" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-gold-600/20" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-gold-600/20" />

          <div className="flex items-center justify-center gap-2 mb-4">
            <Sword size={12} className="text-gold-600/40 -rotate-45" />
            <p className="text-amber-100/40 text-xs tracking-[0.35em] uppercase">
              Адрес для подключения
            </p>
            <Sword size={12} className="text-gold-600/40 rotate-135" />
          </div>

          <CopyToClipboard value={NETWORK_HOST} />

          <p className="text-amber-100/25 text-xs mt-4 tracking-wide">
            Minecraft Java Edition • версии {">"}1.21.x
          </p>
        </div>
      </div>
    </section>
  );
}

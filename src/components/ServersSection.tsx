"use client";
 
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERVERS, NETWORK_HOST } from "@/config/servers";
import CopyToClipboard from "./ui/CopyToClipboard";
import ServerStatusBadge from "./ServerStatusBadge"


export default function ServersSection() {
  return (
    <section id="servers" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-3">
            Наши сервера
          </p>
          <h2
            className="text-4xl md:text-5xl text-amber-100 mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Выбери свой мир
          </h2>
          <div className="h-px w-24 bg-linear-to-r from-transparent via-amber-500 to-transparent mx-auto" />
        </div>
 
        {/* Server cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {SERVERS.map((server) => {
            const Icon = server.icon;
            return (
              <div
                key={server.id}
                className={`relative rounded-2xl border ${server.border} bg-linear-to-br ${server.color} p-8 transition-all duration-300 hover:shadow-2xl ${server.glow} group`}
              >
                {/* Top decoration line */}
                <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-20" />
 
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-3xl">
                      {server.emoji}
                    </div>
                    <div>
                      <h3
                        className="text-2xl text-amber-100 leading-none mb-1"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {server.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${server.badge}`}>
                        {server.tagline}
                      </span>
                    </div>
                  </div>
 
                  {/* Live status */}
                  <ServerStatusBadge host={server.host} />
                </div>
 
                {/* Description */}
                <p className="text-amber-100/70 leading-relaxed mb-6 text-sm">
                  {server.description}
                </p>
 
                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {server.features.map((f) => (
                    <span
                      key={f}
                      className="text-xs px-2.5 py-1 rounded-md bg-black/30 text-amber-100/60 border border-white/5"
                    >
                      {f}
                    </span>
                  ))}
                </div>
 
                {/* CTA */}
                <Link
                  href={server.href}
                  className="flex items-center justify-between w-full px-5 py-3 rounded-xl border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 transition-all group/btn"
                >
                  <span className="text-sm font-medium tracking-wide">
                    Подробнее
                  </span>
                  <ArrowRight
                    size={16}
                    className="group-hover/btn:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            );
          })}
        </div>
 
        {/* IP block */}
        <div
          id="connect"
          className="mt-12 rounded-2xl border border-amber-700/20 bg-duck-stone/50 p-8 text-center"
        >
          <p className="text-amber-100/50 text-sm mb-4 tracking-widest uppercase">
            Адрес для подключения
          </p>
          <CopyToClipboard value={NETWORK_HOST} />
          <p className="text-amber-100/30 text-xs mt-4">
            Minecraft Java Edition • версии {">"} 1.21.x
          </p>
        </div>
      </div>
    </section>
  );
}
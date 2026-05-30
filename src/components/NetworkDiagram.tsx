"use client";

import { Shield, Globe, Server, Cpu, Users, Lock, Zap, RefreshCw, Home, Mic } from "lucide-react";
import { NodeDiagram } from "./node-diagram";
import type { NodeDef, EdgeDef, Vec2 } from "./node-diagram";
import { LINE } from "./node-diagram";

const INIT_OFFSET: Record<string, Vec2> = {
  client: { x: -366, y: -220 },
  proxy: { x: -228, y: -100 },
  auth: { x: -84, y: 0 },
  hub: { x: 68, y: 100 },
  duckburg: { x: 134, y: 255 },
  duckhood: { x: 274, y: 188 },
  backup: { x: 326, y: -73 },
  voice: { x: -244, y: 125 },
};

const NODES: NodeDef[] = [
  { id: "client", label: "Игрок", sublabel: "Minecraft клиент", icon: Users, color: "gold", tooltip: "Клиент подключается с Minecraft Java Edition ≥ 1.21.x" },
  { id: "proxy", label: "Velocity", sublabel: "Единая точка входа", icon: Globe, color: "violet", tooltip: "Proxy-сервер Velocity — точка входа в сеть DuckTale. Маршрутизирует трафик между всеми серверами." },
  { id: "auth", label: "Auth", sublabel: "Авторизация", icon: Shield, dashed: true, color: "rose", tooltip: "Система авторизации игроков перед допуском на серверы." },
  { id: "hub", label: "Hub", sublabel: "Лобби серверов", icon: Home, color: "amber", tooltip: "Сервер-лобби для выбора игрового сервера." },
  { id: "duckburg", label: "DuckBurg", sublabel: "Выживание", icon: Server, color: "emerald", tooltip: "Игровой сервер выживания" },
  { id: "duckhood", label: "DuckHood", sublabel: "Креатив", icon: Server, color: "sky", tooltip: "Игровой творческий сервер" },
  { id: "backup", label: "Бэкапы", sublabel: "Ежедневно", icon: RefreshCw, dashed: true, color: "gold", tooltip: "Ежедневные резервные копии всех игровых данных." },
  { id: "voice", label: "Voice-Chat", sublabel: "Голосовой чат сервера", icon: Mic, dashed: true, color: "gold", tooltip: "Голосовой внутриигровой чат." },
];

const EDGES: EdgeDef[] = [
  { from: "client", to: "proxy", color: "white", tooltip: "Подключение игрока к точке входа сети" },
  { from: "proxy", to: "auth", color: "gold", tooltip: "Velocity направляет на сервис авторизации" },
  { from: "auth", to: "hub", color: "gold", tooltip: "При успешной авторизации перенаправляет на HUB" },
  { from: "hub", to: "duckhood", color: "gold", direction: "both", tooltip: "Перенаправление между HUB и DuckHood" },
  { from: "hub", to: "duckburg", color: "gold", direction: "both", tooltip: "Перенаправление между HUB и DuckBurg" },
  { from: "duckhood", to: "duckburg", color: "gold", direction: "both", tooltip: "Перенаправление между DuckHood и DuckBurg" },
  { from: "backup", to: "duckburg", color: "violet", dashed: true, tooltip: "Автоматическое резервное копирование DuckBurg" },
  { from: "backup", to: "duckhood", color: "violet", dashed: true, tooltip: "Автоматическое резервное копирование DuckHood" },
  { from: "voice", to: "duckburg", color: "violet", dashed: true, tooltip: "Предоставление голосового чата для сервера DuckBurg" },
  { from: "voice", to: "duckhood", color: "violet", dashed: true, tooltip: "Предоставление голосового чата для сервера DuckHood" },
  { from: "voice", to: "hub", color: "violet", dashed: true, tooltip: "Предоставление голосового чата для сервера HUB" },
];

const LEGEND_LINES_ITEMS = [
  { color: "white", label: "Общий трафик", dashed: false },
  { color: "gold", label: "Защищенный трафик", dashed: false },
  { color: "violet", label: "Сервисы", dashed: true },
];

const LEGEND_NODES_ITEMS = [
  { dashed: false, label: "Основная инфраструктура" },
  { dashed: true, label: "Вспомогательный сервис" },
]


function DiagramFooter() {
  return (
    <>
      <div className="absolute bottom-4 left-5 flex flex-col gap-1.5 z-40 pointer-events-none
                      rounded-lg border border-gold-800/20 bg-stone-950/70 px-3 py-2.5"
        style={{ backdropFilter: "blur(10px)" }}>

        {LEGEND_LINES_ITEMS.map(({ color, label, dashed }) => (
          <div key={label} className="flex items-center gap-2">
            <svg width="22" height="6" className="shrink-0" style={{ overflow: "visible" }}>
              <line x1="0" y1="3" x2="22" y2="3"
                stroke={LINE[color]} strokeWidth="1.8" strokeOpacity="0.7"
                strokeDasharray={dashed ? "5 3" : undefined} />
            </svg>
            <span className="text-amber-100/40" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem" }}>
              {label}
            </span>
          </div>
        ))}

        <div className="h-px bg-gold-800/20 my-0.5" />

        {LEGEND_NODES_ITEMS.map(({ dashed, label }) => (
          <div key={label} className="flex items-center gap-2">
            <svg width="22" height="14" className="shrink-0" style={{ overflow: "visible" }}>
              <rect
                x="1" y="1" width="20" height="12" rx="3"
                fill="none"
                stroke="#d4a017"
                strokeOpacity="0.35"
                strokeWidth="1.4"
                strokeDasharray={dashed ? "3 2.5" : undefined}
              />
            </svg>
            <span className="text-amber-100/40" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 right-5 z-40 pointer-events-none
                      rounded-lg border border-gold-800/15 bg-stone-950/60 px-3 py-1.5
                      text-amber-100/40 font-mono"
        style={{ backdropFilter: "blur(8px)", fontSize: "0.56rem" }}>
        <p>Наведи / тапни, чтобы узнать подробнее</p>
        <p>Потяни, чтобы переместить</p>
      </div>
    </>
  );
}

function DiagramHeader() {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-gold-800/20 bg-stone-950/40 relative z-10">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-gold-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
      </div>
      <p className="text-amber-100/25 text-xs tracking-widest ml-3 font-mono">
        DUCKTALE — Топология сети
      </p>
      <Lock size={10} className="text-gold-700/40 ml-auto" />
    </div>
  );
}


export default function NetworkDiagram() {
  return (
    <section id="infrastructure" className="py-28 px-6 relative">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-gold-700/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-gold-500/60 text-xs tracking-[0.4em] uppercase mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-6 bg-linear-to-r from-transparent to-gold-500/40 inline-block" />
            Инфраструктура
            <span className="h-px w-6 bg-linear-to-l from-transparent to-gold-500/40 inline-block" />
          </p>
          <h2 className="text-4xl md:text-5xl text-amber-100/90 mb-5 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}>
            Архитектура сети
          </h2>
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px flex-1 max-w-20 bg-linear-to-r from-transparent to-gold-700/35" />
            <Zap size={12} className="text-gold-600/50" />
            <div className="h-px flex-1 max-w-20 bg-linear-to-l from-transparent to-gold-700/35" />
          </div>
          <p className="text-amber-100/45 max-w-xl mx-auto leading-relaxed text-base"
            style={{ fontFamily: "var(--font-body)" }}>
            Схема связи между серверами DuckTale. Наведи на узел или линию — узнай подробности.
            Узлы можно перетаскивать, пространство — двигать.
          </p>
        </div>

        <NodeDiagram
          nodes={NODES}
          edges={EDGES}
          initOffsets={INIT_OFFSET}
          header={<DiagramHeader />}
          title={<DiagramFooter />}
        />
      </div>
    </section>
  );
}

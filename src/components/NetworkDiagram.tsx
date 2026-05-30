"use client";

import { Lock, Zap } from "lucide-react";
import { NodeDiagram } from "./node-diagram";
import { LINE } from "./node-diagram";
import {
  DIAGRAM_NODES,
  DIAGRAM_EDGES,
  DIAGRAM_INIT_OFFSETS,
  DIAGRAM_LEGEND_LINES,
  DIAGRAM_LEGEND_NODES,
} from "@/config/diagram";
import SectionHeader from "@/components/SectionHeader";

// ─── Legend / chrome sub-components ──────────────────────────────────────────

function DiagramLegend() {
  return (
    <div
      className="absolute bottom-4 left-5 flex flex-col gap-1.5 z-40 pointer-events-none
                 rounded-lg border border-gold-800/20 bg-stone-950/70 px-3 py-2.5"
      style={{ backdropFilter: "blur(10px)" }}
    >
      {DIAGRAM_LEGEND_LINES.map(({ color, label, dashed }) => (
        <div key={label} className="flex items-center gap-2">
          <svg width="22" height="6" className="shrink-0" style={{ overflow: "visible" }}>
            <line
              x1="0" y1="3" x2="22" y2="3"
              stroke={LINE[color]} strokeWidth="1.8" strokeOpacity="0.7"
              strokeDasharray={dashed ? "5 3" : undefined}
            />
          </svg>
          <span className="text-amber-100/40" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem" }}>
            {label}
          </span>
        </div>
      ))}

      <div className="h-px bg-gold-800/20 my-0.5" />

      {DIAGRAM_LEGEND_NODES.map(({ dashed, label }) => (
        <div key={label} className="flex items-center gap-2">
          <svg width="22" height="14" className="shrink-0" style={{ overflow: "visible" }}>
            <rect
              x="1" y="1" width="20" height="12" rx="3"
              fill="none" stroke="#d4a017" strokeOpacity="0.35" strokeWidth="1.4"
              strokeDasharray={dashed ? "3 2.5" : undefined}
            />
          </svg>
          <span className="text-amber-100/40" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DiagramHints() {
  return (
    <div
      className="absolute bottom-4 right-5 z-40 pointer-events-none
                 rounded-lg border border-gold-800/15 bg-stone-950/60 px-3 py-1.5
                 text-amber-100/40 font-mono"
      style={{ backdropFilter: "blur(8px)", fontSize: "0.56rem" }}
    >
      <p>Наведи / тапни, чтобы узнать подробнее</p>
      <p>Потяни, чтобы переместить</p>
    </div>
  );
}

function DiagramChrome() {
  return (
    <>
      <DiagramLegend />
      <DiagramHints />
    </>
  );
}

function DiagramTitleBar() {
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

// ─── Section ──────────────────────────────────────────────────────────────────

export default function NetworkDiagram() {
  return (
    <section id="infrastructure" className="py-28 px-6 relative">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-gold-700/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <SectionHeader
          label="Инфраструктура"
          title="Архитектура сети"
          description="Схема связи между серверами DuckTale. Наведи на узел или линию — узнай подробности. Узлы можно перетаскивать, пространство — двигать."
        >
          {/* Custom divider with Zap icon */}
          <div className="flex items-center justify-center gap-3 mt-5 mb-0">
            <div className="h-px flex-1 max-w-20 bg-linear-to-r from-transparent to-gold-700/35" />
            <Zap size={12} className="text-gold-600/50" />
            <div className="h-px flex-1 max-w-20 bg-linear-to-l from-transparent to-gold-700/35" />
          </div>
        </SectionHeader>

        <NodeDiagram
          nodes={DIAGRAM_NODES}
          edges={DIAGRAM_EDGES}
          initOffsets={DIAGRAM_INIT_OFFSETS}
          header={<DiagramTitleBar />}
          title={<DiagramChrome />}
        />
      </div>
    </section>
  );
}

"use client";

import { Lock, Zap, Maximize2, Minimize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { DIAGRAM, DIAGRAM_LINE as LINE } from "@/config/site";
import {
  DIAGRAM_NODE_DEFS,
  DIAGRAM_EDGE_DEFS,
  DIAGRAM_INIT_OFFSETS,
  DIAGRAM_LEGEND_LINE_DEFS,
  DIAGRAM_LEGEND_NODE_DEFS,
} from "@/config/diagram";
import SectionHeader from "@/components/SectionHeader";

// AntV X6 touches `window` at module scope, so it can only load in the
// browser — importing it during the server render pass crashes the SSR
// worker outright, before any useEffect guard would even run.
const GraphDiagram = dynamic(() => import("./graph").then((m) => m.GraphDiagram), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-2xl border border-primary/25 bg-card/60 animate-pulse"
      style={{ height: DIAGRAM.frameH }}
    />
  ),
});

// ─── Legend / chrome sub-components ──────────────────────────────────────────

function DiagramLegend() {
  const t = useTranslations("Infrastructure");
  return (
    <div
      className="absolute bottom-4 left-5 flex flex-col gap-1.5 z-40 pointer-events-none
                 rounded-lg border border-primary/20 bg-card/70 px-3 py-2.5"
      style={{ backdropFilter: "blur(10px)" }}
    >
      {DIAGRAM_LEGEND_LINE_DEFS.map(({ color, key, dashed }) => (
        <div key={key} className="flex items-center gap-2">
          <svg width="22" height="6" className="shrink-0" style={{ overflow: "visible" }}>
            <line
              x1="0" y1="3" x2="22" y2="3"
              stroke={LINE[color]} strokeWidth="1.8" strokeOpacity="0.7"
              strokeDasharray={dashed ? "5 3" : undefined}
            />
          </svg>
          <span className="text-foreground/40" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem" }}>
            {t(`legendLines.${key}`)}
          </span>
        </div>
      ))}

      <div className="h-px bg-primary/20 my-0.5" />

      {DIAGRAM_LEGEND_NODE_DEFS.map(({ dashed, key }) => (
        <div key={key} className="flex items-center gap-2">
          <svg width="22" height="14" className="shrink-0" style={{ overflow: "visible" }}>
            <rect
              x="1" y="1" width="20" height="12" rx="3"
              fill="none" stroke="var(--color-accent-gold)" strokeOpacity="0.35" strokeWidth="1.4"
              strokeDasharray={dashed ? "3 2.5" : undefined}
            />
          </svg>
          <span className="text-foreground/40" style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem" }}>
            {t(`legendNodes.${key}`)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DiagramHints() {
  const t = useTranslations("Infrastructure.hints");
  return (
    <div
      className="absolute bottom-4 right-5 z-40 pointer-events-none
                 rounded-lg border border-primary/15 bg-card/60 px-3 py-1.5
                 text-foreground/40 font-mono"
      style={{ backdropFilter: "blur(8px)", fontSize: "0.56rem" }}
    >
      <p>{t("hover")}</p>
      <p>{t("drag")}</p>
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

function DiagramTitleBar({ fullscreen, toggleFullscreen, closeButtonRef, expandLabel, collapseLabel }: any) {
  const t = useTranslations("Infrastructure");
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/20 bg-card/40 relative z-10">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
      </div>
      <p className="text-foreground/25 text-xs tracking-widest ml-3 font-mono">
        {t("titleBar")}
      </p>
      <div className="ml-auto flex items-center gap-3">
        <button
          ref={closeButtonRef}
          onClick={toggleFullscreen}
          aria-label={fullscreen ? collapseLabel : expandLabel}
          title={fullscreen ? collapseLabel : expandLabel}
          className="flex items-center justify-center text-primary/40 hover:text-primary transition-colors outline-none rounded"
        >
          {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
        <Lock size={10} className="text-primary/40" />
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function NetworkDiagram() {
  const t = useTranslations("Infrastructure");

  const nodes = DIAGRAM_NODE_DEFS.map((n) => ({
    ...n,
    label: t(`nodes.${n.id}.label`),
    sublabel: t(`nodes.${n.id}.sublabel`),
    tooltip: t(`nodes.${n.id}.tooltip`),
  }));

  const edges = DIAGRAM_EDGE_DEFS.map((e) => ({
    ...e,
    tooltip: t(`edges.${e.key}`),
  }));

  return (
    <section id="infrastructure" className="py-28 px-6 relative">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <SectionHeader
          label={t("label")}
          title={t("title")}
          description={t("description")}
        >
          {/* Custom divider with Zap icon */}
          <div className="flex items-center justify-center gap-3 mt-5 mb-0">
            <div className="h-px flex-1 max-w-20 bg-linear-to-r from-transparent to-primary/35" />
            <Zap size={12} className="text-primary/50" />
            <div className="h-px flex-1 max-w-20 bg-linear-to-l from-transparent to-primary/35" />
          </div>
        </SectionHeader>

        <GraphDiagram
          nodes={nodes}
          edges={edges}
          initOffsets={DIAGRAM_INIT_OFFSETS}
          header={(props) => (
            <DiagramTitleBar 
              {...props} 
              expandLabel={t("expand")} 
              collapseLabel={t("collapse")} 
            />
          )}
          overlay={<DiagramChrome />}
          expandLabel={t("expand")}
          collapseLabel={t("collapse")}
        />
      </div>
    </section>
  );
}

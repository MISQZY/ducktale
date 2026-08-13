"use client";

import { useEffect, useRef, useState } from "react";
import { Graph } from "@antv/x6";
import { EmbedPage } from "@/components/docs";
import { DIAGRAM } from "@/config/site";
import { Plus, Minus, Target, Maximize2, Minimize2, Lock } from "lucide-react";

const GRID_CELL = DIAGRAM.gridCell;
const GRID_BG_URL =
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${GRID_CELL}' height='${GRID_CELL}'%3E` +
  `%3Cpath d='M ${GRID_CELL} 0 H 0 M 0 0 V ${GRID_CELL}' fill='none' stroke='rgba(212,160,23,0.06)' stroke-width='1'/%3E%3C/svg%3E`;

export interface GraphCanvasProps {
  header?: string | React.ReactNode;
  frameHeight?: number | string;
  graphOptions?: Record<string, unknown>;
  onInit: (graph: Graph) => (() => void) | void;
  children?: React.ReactNode;
  expandLabel?: string;
  collapseLabel?: string;
}

export function GraphCanvas({ 
  header, 
  frameHeight = DIAGRAM.frameH, 
  graphOptions, 
  onInit, 
  children,
  expandLabel = "Развернуть на весь экран",
  collapseLabel = "Свернуть"
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<Graph | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const graphContainer = document.createElement("div");
    graphContainer.style.width = "100%";
    graphContainer.style.height = "100%";
    container.appendChild(graphContainer);

    const g = new Graph({
      container: graphContainer,
      autoResize: true,
      panning: { enabled: true, eventTypes: ["leftMouseDown"] },
      mousewheel: { enabled: true, modifiers: ["ctrl", "meta"], minScale: 0.2, maxScale: 1.5 },
      grid: { size: 1, visible: false },
      ...graphOptions,
    });

    setGraph(g);

    let lastWidth = 0;
    let lastHeight = 0;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      
      const { width, height } = entry.contentRect;
      if (width === 0 && height === 0) return;
      
      const dw = Math.abs(width - lastWidth);
      const dh = Math.abs(height - lastHeight);
      
      // Center on initial render OR when there is a significant size change (e.g. fullscreen toggle)
      // This prevents tiny resizes (like a scrollbar appearing) from resetting the user's pan/zoom state.
      if ((lastWidth === 0 && lastHeight === 0) || dw > 50 || dh > 50) {
        if (!g.disposed) {
          requestAnimationFrame(() => {
            if (!g.disposed) g.centerContent();
          });
        }
      }
      
      lastWidth = width;
      lastHeight = height;
    });
    
    observer.observe(container);

    g.on("node:mousedown", () => {
      container.classList.add("is-dragging-node");
    });
    g.on("node:mouseup", () => {
      container.classList.remove("is-dragging-node");
    });
    // Also remove on blank mouseup just in case the mouseup happens outside the node
    g.on("blank:mouseup", () => {
      container.classList.remove("is-dragging-node");
    });

    const cleanup = onInit(g);

    return () => {
      observer.disconnect();
      if (cleanup) cleanup();
      setTimeout(() => {
        g.dispose();
        graphContainer.remove();
      }, 0);
    };
    // Mount-only: the graph owns node/edge lifecycle from here on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomIn = () => graph?.zoom(0.2, { maxScale: 1.5 });
  const zoomOut = () => graph?.zoom(-0.2, { minScale: 0.2 });
  const zoomFit = () => graph?.centerContent();

  return (
    <EmbedPage 
      height={frameHeight}
      expandLabel={expandLabel}
      collapseLabel={collapseLabel}
      header={({ fullscreen, toggleFullscreen, closeButtonRef }) => (
        <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/20 bg-card/40 relative z-10">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <p className="text-foreground/25 text-xs tracking-widest ml-3 font-mono">
            {header as React.ReactNode}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1 border-r border-primary/10 pr-4">
              <button onClick={zoomOut} className="flex items-center justify-center p-1 text-primary/40 hover:text-primary transition-colors outline-none rounded" title="Отдалить">
                <Minus size={14} />
              </button>
              <button onClick={zoomIn} className="flex items-center justify-center p-1 text-primary/40 hover:text-primary transition-colors outline-none rounded" title="Приблизить">
                <Plus size={14} />
              </button>
              <button onClick={zoomFit} className="flex items-center justify-center p-1 text-primary/40 hover:text-primary transition-colors outline-none rounded ml-1" title="По центру">
                <Target size={14} />
              </button>
            </div>
            
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
      )}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing [&.is-dragging-node]:!cursor-grabbing [&.is-dragging-node_*]:!cursor-grabbing"
        style={{ backgroundImage: `url("${GRID_BG_URL}")`, backgroundSize: `${GRID_CELL}px ${GRID_CELL}px` }}
      />
      
      {children}
    </EmbedPage>
  );
}

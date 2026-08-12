"use client";

import { useEffect, useRef, useState, useId } from "react";
import { Graph, type Edge } from "@antv/x6";
import { cn } from "@/lib/utils";
import { EmbedPage } from "@/components/docs";
import { DIAGRAM } from "@/config/site";
import { NODE_SHAPE, edgeLineAttrs } from "./shapes";
import { resolvePushCollisions } from "./utils";
import type { GraphDiagramProps, GraphEdgeData, GraphNodeData, TooltipState } from "./types";

export type { GraphNodeDef, GraphEdgeDef, GraphDiagramProps, Vec2 } from "./types";

// Static decorative grid rendered as a CSS background instead of X6's own
// `grid` option — X6 ties its grid `size` to the drag-snap increment (see
// below), so a visible 48px grid would force every node drag to jump in
// 48px steps. Keeping this one purely cosmetic decouples the two.
const GRID_CELL = DIAGRAM.gridCell;
const GRID_BG_URL =
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${GRID_CELL}' height='${GRID_CELL}'%3E` +
  `%3Cpath d='M ${GRID_CELL} 0 H 0 M 0 0 V ${GRID_CELL}' fill='none' stroke='rgba(212,160,23,0.06)' stroke-width='1'/%3E%3C/svg%3E`;

// Returns the tooltip's top-left corner (not the anchor point itself) —
// offset up-and-right of the pointer so the box doesn't sit right under it.
function pointerTooltipPos(
  container: HTMLElement,
  e: { clientX: number; clientY: number },
  text: string
): TooltipState {
  const rect = container.getBoundingClientRect();
  return {
    text,
    x: e.clientX - rect.left + 14,
    y: e.clientY - rect.top - 60,
    frameW: rect.width,
    frameH: rect.height,
  };
}

const EDGE_TOOLTIP_OFFSET = 56;

// A tooltip offset diagonally from the pointer (like pointerTooltipPos)
// tends to sit right on top of the hovered line itself whenever the edge
// happens to run in roughly that same diagonal — the glowing hover line
// then looks like it's been cut in half. Offsetting perpendicular to the
// edge's own direction instead guarantees the tooltip sits beside the
// line, not on it, regardless of the edge's angle.
function edgeTooltipPos(
  graph: Graph,
  container: HTMLElement,
  edge: Edge,
  e: { clientX: number; clientY: number },
  text: string
): TooltipState {
  const rect = container.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  const sp = graph.localToClient(edge.getSourcePoint());
  const tp = graph.localToClient(edge.getTargetPoint());
  const dx = tp.x - sp.x;
  const dy = tp.y - sp.y;
  const len = Math.hypot(dx, dy) || 1;

  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }

  return {
    text,
    x: px + nx * EDGE_TOOLTIP_OFFSET,
    y: py + ny * EDGE_TOOLTIP_OFFSET,
    frameW: rect.width,
    frameH: rect.height,
  };
}

export function GraphDiagram({
  nodes,
  edges,
  initOffsets,
  header,
  overlay,
  cardWidth = DIAGRAM.cardW,
  cardHeight = DIAGRAM.cardH,
  frameHeight = DIAGRAM.frameH,
  expandLabel = "Развернуть на весь экран",
  collapseLabel = "Свернуть",
}: GraphDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const rawId = useId();
  const glowFilterId = `graph-edge-glow-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create a dedicated div for this graph instance. In React 18 Strict Mode,
    // the delayed dispose() will wipe the container's innerHTML. By using a 
    // dedicated child, it only wipes its own DOM and doesn't destroy the next mount.
    const graphContainer = document.createElement("div");
    graphContainer.style.width = "100%";
    graphContainer.style.height = "100%";
    container.appendChild(graphContainer);

    const graph = new Graph({
      container: graphContainer,
      autoResize: true,
      panning: { enabled: true, eventTypes: ["leftMouseDown"] },
      mousewheel: false,
      // size:1 keeps graph.snapToGrid() a no-op so dragging tracks the
      // pointer 1:1 — the visible grid is drawn separately as a CSS
      // background (see GRID_BG_URL) so it doesn't drag the snap step with it.
      grid: { size: 1, visible: false },
      interacting: {
        nodeMovable: true,
        edgeMovable: false,
        edgeLabelMovable: false,
        arrowheadMovable: false,
        vertexMovable: false,
        magnetConnectable: false,
      },
      connecting: { allowBlank: false, allowNode: false, allowEdge: false, allowLoop: false },
      // Edges aren't movable (above), so by default X6 falls back to
      // treating an edge mousedown as blank-canvas panning — grabbing a
      // line would drag the whole viewport. Block mousedown on edges
      // outright; hover (mouseenter/leave, for the tooltip) isn't gated
      // by `guard` so it still works.
      guard: (e, view) => e.type === "mousedown" && !!view?.cell?.isEdge?.(),
    });

    // Auto-center graph if the container resizes (e.g. toggling fullscreen mode)
    graph.on("resize", () => {
      if (!graph.disposed) graph.centerContent();
    });

    for (const n of nodes) {
      const off = initOffsets[n.id] ?? { x: 0, y: 0 };
      graph.addNode({
        id: n.id,
        shape: NODE_SHAPE,
        x: off.x - cardWidth / 2,
        y: off.y - cardHeight / 2,
        width: cardWidth,
        height: cardHeight,
        data: {
          label: n.label,
          sublabel: n.sublabel,
          tooltip: n.tooltip,
          icon: n.icon,
          color: n.color,
          dashed: n.dashed,
          active: false,
        } satisfies GraphNodeData,
      });
    }

    for (const e of edges) {
      const direction = e.direction ?? "forward";
      graph.addEdge({
        id: e.key,
        source: e.from,
        target: e.to,
        zIndex: 0,
        data: {
          tooltip: e.tooltip,
          color: e.color,
          dashed: e.dashed,
          direction,
        } satisfies GraphEdgeData,
        attrs: { line: edgeLineAttrs(e.color, e.dashed, direction) },
      });
    }

    // Delay centering slightly so the DOM has time to resolve container dimensions,
    // otherwise the nodes fly away to 0,0 if the flex/relative layout hasn't fully painted.
    requestAnimationFrame(() => {
      if (!graph.disposed) graph.centerContent();
    });

    let activeEdgeIds: string[] = [];

    // Swaps the whole `line` attrs object (stroke width, opacity, and the
    // marker's own stroke width together) rather than tweaking individual
    // sub-properties — the marker caches its stroke width (and the refX
    // offset X6 derives from it) at definition time, so updating only the
    // line's width leaves the arrowhead thin while the shaft thickens,
    // visibly seaming/overlapping the two at some angles.
    const resetEdge = (edge: Edge) => {
      const d = edge.getData<GraphEdgeData>();
      edge.attr("line", edgeLineAttrs(d?.color, d?.dashed, d?.direction, false));
      edge.attr("line/filter", null);
    };

    const clearActiveEdges = () => {
      for (const id of activeEdgeIds) {
        const edge = graph.getCellById(id);
        if (edge.isEdge()) resetEdge(edge);
      }
      activeEdgeIds = [];
    };

    const highlightEdges = (list: Edge[]) => {
      activeEdgeIds = list.map((e) => e.id);
      for (const edge of list) {
        const d = edge.getData<GraphEdgeData>();
        edge.attr("line", edgeLineAttrs(d?.color, d?.dashed, d?.direction, true));
        edge.attr("line/filter", `url(#${glowFilterId})`);
      }
    };

    graph.on("node:mouseenter", ({ node, e }) => {
      node.setData({ active: true } satisfies Partial<GraphNodeData>);
      node.toFront();
      highlightEdges(graph.getConnectedEdges(node));
      const tooltipText = node.getData<GraphNodeData>().tooltip;
      if (tooltipText) setTooltip(pointerTooltipPos(container, e, tooltipText));
    });

    graph.on("node:mouseleave", ({ node }) => {
      node.setData({ active: false } satisfies Partial<GraphNodeData>);
      clearActiveEdges();
      setTooltip(null);
    });

    graph.on("edge:mouseenter", ({ edge, e }) => {
      const tooltipText = edge.getData<GraphEdgeData>()?.tooltip;
      if (!tooltipText) return;
      highlightEdges([edge]);
      setTooltip(edgeTooltipPos(graph, container, edge, e, tooltipText));
    });

    graph.on("edge:mouseleave", () => {
      clearActiveEdges();
      setTooltip(null);
    });

    graph.on("node:moving", ({ node }) => {
      const rects: Record<string, { x: number; y: number; width: number; height: number }> = {};
      for (const n of graph.getNodes()) rects[n.id] = { ...n.position(), ...n.size() };

      const resolved = resolvePushCollisions(rects, node.id);
      for (const n of graph.getNodes()) {
        if (n.id === node.id) continue;
        const r = resolved[n.id];
        const cur = n.position();
        if (r.x !== cur.x || r.y !== cur.y) n.position(r.x, r.y);
      }
    });

    const onContainerLeave = () => {
      clearActiveEdges();
      setTooltip(null);
      for (const n of graph.getNodes()) n.setData({ active: false } satisfies Partial<GraphNodeData>);
    };
    container.addEventListener("mouseleave", onContainerLeave);

    return () => {
      container.removeEventListener("mouseleave", onContainerLeave);
      // Dispose asynchronously to prevent React root unmount race condition
      // (antv/x6 unmounts internal portals synchronously, conflicting with React 18+ renders).
      setTimeout(() => {
        graph.dispose();
        graphContainer.remove();
      }, 0);
    };
    // Mount-only: the graph owns node/edge lifecycle from here on, so it
    // isn't rebuilt (and drag state isn't lost) on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EmbedPage
      header={header}
      height={frameHeight}
      expandLabel={expandLabel}
      collapseLabel={collapseLabel}
    >
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <filter id={glowFilterId}>
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ backgroundImage: `url("${GRID_BG_URL}")`, backgroundSize: `${GRID_CELL}px ${GRID_CELL}px` }}
      />

      {overlay}

      {tooltip && (
        <div
          className="absolute pointer-events-none z-40"
          style={{
            left: Math.min(Math.max(tooltip.x, 8), tooltip.frameW - 248),
            top: Math.min(Math.max(tooltip.y, 8), tooltip.frameH - 72),
          }}
        >
          <div
            className="rounded-lg border border-primary/30 bg-card/96 px-3.5 py-2.5 text-foreground/80 text-xs leading-relaxed"
            style={{
              maxWidth: 232,
            }}
          >
            {tooltip.text}
          </div>
        </div>
      )}
    </EmbedPage>
  );
}

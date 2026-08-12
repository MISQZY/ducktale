"use client";

import React, { useState, useId } from "react";
import { Graph, type Edge } from "@antv/x6";
import { cn } from "@/lib/utils";
import { DIAGRAM } from "@/config/site";
import { NODE_SHAPE, edgeLineAttrs } from "./shapes";
import { wireNodeCollisionResolution } from "./utils";
import type { GraphDiagramProps, GraphEdgeData, GraphNodeData, TooltipState } from "./types";
import { GraphCanvas } from "./GraphCanvas";

export type { GraphNodeDef, GraphEdgeDef, GraphDiagramProps, Vec2 } from "./types";

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
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const rawId = useId();
  const glowFilterId = `graph-edge-glow-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const initGraph = React.useCallback((graph: Graph) => {
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
      const container = graph.container;
      if (tooltipText && container) setTooltip(pointerTooltipPos(container, e, tooltipText));
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
      const container = graph.container;
      if (container) setTooltip(edgeTooltipPos(graph, container, edge, e, tooltipText));
    });

    graph.on("edge:mouseleave", () => {
      clearActiveEdges();
      setTooltip(null);
    });

    wireNodeCollisionResolution(graph);

    const onContainerLeave = () => {
      clearActiveEdges();
      setTooltip(null);
      for (const n of graph.getNodes()) n.setData({ active: false } satisfies Partial<GraphNodeData>);
    };
    
    if (graph.container) {
      graph.container.addEventListener("mouseleave", onContainerLeave);
      return () => {
        graph.container.removeEventListener("mouseleave", onContainerLeave);
      };
    }
  }, [nodes, edges, initOffsets, cardWidth, cardHeight, glowFilterId]);

  return (
    <GraphCanvas
      header={header}
      frameHeight={frameHeight}
      expandLabel={expandLabel}
      collapseLabel={collapseLabel}
      onInit={initGraph}
      graphOptions={{
        interacting: {
          nodeMovable: true,
          edgeMovable: false,
          edgeLabelMovable: false,
          arrowheadMovable: false,
          vertexMovable: false,
          magnetConnectable: false,
        },
        connecting: { allowBlank: false, allowNode: false, allowEdge: false, allowLoop: false },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        guard: (e: any, view: any) => e.type === "mousedown" && !!view?.cell?.isEdge?.(),
      }}
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
    </GraphCanvas>
  );
}

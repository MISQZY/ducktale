"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CANVAS_W, CANVAS_H, CX, CY, COLOR, LINE, CARD_H, CARD_W } from "./constants";
import { toAbs, clampNode, toFrame, clampPan, resolveCollisions } from "./utils";
import type { NodeDef, EdgeDef, Vec2, TooltipState, NodeDiagramProps } from "./types";

export type { NodeDef, EdgeDef, Vec2, TooltipState, NodeDiagramProps };

// Arrow directions supported via EdgeDef:
//   direction?: "forward" | "backward" | "both" | "none"
//   - "forward"  (default) — arrowhead at `to`
//   - "backward"           — arrowhead at `from`
//   - "both"               — arrowheads at both ends
//   - "none"               — plain line, no arrowheads

export function NodeDiagram({ nodes, edges, initOffsets, title, header }: NodeDiagramProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameDims, setFrameDims] = useState({ w: 800, h: 460 });

  const [pan, setPan] = useState<Vec2>({ x: 0, y: 0 });
  const panRef = useRef<Vec2>({ x: 0, y: 0 });
  const panStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const [positions, setPositions] = useState<Record<string, Vec2>>(() =>
    Object.fromEntries(nodes.map((n) => [n.id, toAbs(initOffsets[n.id] ?? { x: 0, y: 0 })]))
  );

  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [activeEdge, setActiveEdge] = useState<number | null>(null);

  const clampPanMemo = useCallback(
    (px: number, py: number, fw: number, fh: number): Vec2 => clampPan(px, py, fw, fh),
    []
  );

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      setFrameDims({ w, h });
      setPan((p) => {
        const c = clampPanMemo(p.x, p.y, w, h);
        panRef.current = c;
        return c;
      });
    });
    ro.observe(el);
    const w = el.clientWidth, h = el.clientHeight;
    setFrameDims({ w, h });
    const initPan = clampPanMemo(0, 0, w, h);
    panRef.current = initPan;
    setPan(initPan);
    return () => ro.disconnect();
  }, [clampPanMemo]);

  const getCanvasOffset = useCallback(() => ({
    left: frameDims.w / 2 - CX + panRef.current.x,
    top: frameDims.h / 2 - CY + panRef.current.y,
  }), [frameDims]);

  const moveNodeTo = useCallback((clientX: number, clientY: number) => {
    const d = dragging.current;
    if (!d) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { left, top } = getCanvasOffset();
    const vx = clientX - rect.left - left - d.ox;
    const vy = clientY - rect.top - top - d.oy;
    setPositions((prev) => {
      const updated = { ...prev, [d.id]: clampNode(vx, vy) };
      return resolveCollisions(updated, d.id);
    });
    setTooltip(null);
  }, [getCanvasOffset]);

  const movePanTo = useCallback((clientX: number, clientY: number) => {
    const ps = panStart.current;
    if (!ps) return;
    const raw = { x: clientX - ps.mx + ps.px, y: clientY - ps.my + ps.py };
    const c = clampPanMemo(raw.x, raw.y, frameDims.w, frameDims.h);
    panRef.current = c;
    setPan(c);
  }, [clampPanMemo, frameDims]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) { moveNodeTo(e.clientX, e.clientY); return; }
      if (panStart.current) { movePanTo(e.clientX, e.clientY); }
    };
    const onUp = () => {
      dragging.current = null;
      panStart.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [moveNodeTo, movePanTo]);

  const onFrameMouseDown = (e: React.MouseEvent) => {
    if (dragging.current) return;
    panStart.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y };
  };

  const onNodeMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = positions[id];
    if (!pos) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { left, top } = getCanvasOffset();
    dragging.current = {
      id,
      ox: e.clientX - rect.left - left - pos.x,
      oy: e.clientY - rect.top - top - pos.y,
    };
  };

  const touchId = useRef<number | null>(null);

  const onFrameTouchStart = (e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    panStart.current = {
      mx: touch.clientX, my: touch.clientY,
      px: panRef.current.x, py: panRef.current.y,
    };
  };

  const onNodeTouchStart = (id: string, e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    panStart.current = null;

    const pos = positions[id];
    if (!pos) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { left, top } = getCanvasOffset();
    dragging.current = {
      id,
      ox: touch.clientX - rect.left - left - pos.x,
      oy: touch.clientY - rect.top - top - pos.y,
    };
    setActiveNode(id);
  };

  useEffect(() => {
    const getTrackedTouch = (list: TouchList) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].identifier === touchId.current) return list[i];
      }
      return null;
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = getTrackedTouch(e.changedTouches);
      if (!touch) return;
      e.preventDefault();
      if (dragging.current) { moveNodeTo(touch.clientX, touch.clientY); return; }
      if (panStart.current) { movePanTo(touch.clientX, touch.clientY); }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = getTrackedTouch(e.changedTouches);
      if (!touch) return;
      touchId.current = null;
      dragging.current = null;
      panStart.current = null;
      setActiveNode(null);
      setTooltip(null);
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [moveNodeTo, movePanTo]);

  const toFramePos = useCallback(
    (v: Vec2) => toFrame(v, frameDims, pan),
    [frameDims, pan]
  );

  const handleNodeEnter = (node: NodeDef) => {
    if (dragging.current) return;
    const fp = toFramePos(positions[node.id] ?? { x: CX, y: CY });
    setTooltip({ text: node.tooltip, fx: fp.x, fy: fp.y });
    setActiveNode(node.id);
  };

  const handleEdgeEnter = (edge: EdgeDef, idx: number, fx: number, fy: number) => {
    if (!edge.tooltip) return;
    setTooltip({ text: edge.tooltip, fx, fy });
    setActiveEdge(idx);
  };

  const clearHover = () => {
    setTooltip(null);
    setActiveNode(null);
    setActiveEdge(null);
  };

  const ARROW_INSET = 4;

  /**
   * Returns the point where the line from `other` to `target` first touches
   * the rectangular boundary of the card centred at `target`.
   *
   * @param target centre of the card we are computing the edge for
   * @param other centre of the opposite card
   * @param inset extra gap to pull the point back along the normal (for arrowheads)
   */
  const cardEdgePoint = (target: Vec2, other: Vec2, inset = 0): Vec2 => {
    const hw = CARD_W / 2;
    const hh = CARD_H / 2;
    const dx = other.x - target.x;
    const dy = other.y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return target;

    const nx = dx / dist;
    const ny = dy / dist;

    const tx = hw / Math.abs(nx || 1e-9);
    const ty = hh / Math.abs(ny || 1e-9);
    const t = Math.min(tx, ty);

    return {
      x: target.x + nx * (t + inset),
      y: target.y + ny * (t + inset),
    };
  };

  const edgeEndpoints = (edge: EdgeDef): { lineStart: Vec2; lineEnd: Vec2 } | null => {
    const fp = positions[edge.from];
    const tp = positions[edge.to];
    if (!fp || !tp) return null;

    const dir = edge.direction ?? "forward";
    const hasArrowEnd = dir === "forward" || dir === "both";
    const hasArrowStart = dir === "backward" || dir === "both";

    const lineStart = cardEdgePoint(fp, tp, hasArrowStart ? ARROW_INSET : 0);
    const lineEnd = cardEdgePoint(tp, fp, hasArrowEnd ? ARROW_INSET : 0);

    return { lineStart, lineEnd };
  };

  const edgeMidFrame = (edge: EdgeDef): Vec2 | null => {
    const ep = edgeEndpoints(edge);
    if (!ep) return null;
    return toFramePos({
      x: (ep.lineStart.x + ep.lineEnd.x) / 2,
      y: (ep.lineStart.y + ep.lineEnd.y) / 2,
    });
  };

  const canvasLeft = frameDims.w / 2 - CX + pan.x;
  const canvasTop = frameDims.h / 2 - CY + pan.y;

  return (
    <div
      className="relative rounded-2xl border border-gold-700/25 bg-stone-900/60 overflow-hidden"
      style={{ boxShadow: "0 0 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,160,23,0.06)" }}
    >
      {(["tl", "tr", "bl", "br"] as const).map((p) => (
        <div key={p} className={cn(
          "absolute w-6 h-6 pointer-events-none z-20 border-gold-500/40",
          p === "tl" && "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
          p === "tr" && "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
          p === "bl" && "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
          p === "br" && "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
        )} />
      ))}

      {header}

      <div
        ref={frameRef}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        style={{ height: 620 }}
        onMouseDown={onFrameMouseDown}
        onMouseLeave={clearHover}
        onTouchStart={onFrameTouchStart}
      >
        <div
          className="absolute pointer-events-none"
          style={{ left: canvasLeft, top: canvasTop, width: CANVAS_W, height: CANVAS_H }}
        >
          {/* Grid */}
          <svg width={CANVAS_W} height={CANVAS_H} className="absolute inset-0 opacity-[0.035]">
            <defs>
              <pattern id="nd-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#d4a017" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#nd-grid)" />
          </svg>

          {/* Edges */}
          <svg width={CANVAS_W} height={CANVAS_H} className="absolute inset-0">
            <defs>
              {(["gold", "emerald", "sky", "white"] as const).map((c) => (
                <marker
                  key={c}
                  id={`nd-arr-${c}`}
                  viewBox="0 0 10 10"
                  refX="2"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path
                    d="M2 1L8 5L2 9"
                    fill="none"
                    stroke={LINE[c] ?? "#ffffff"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </marker>
              ))}

              {(["gold", "emerald", "sky", "white"] as const).map((c) => (
                <marker
                  key={`${c}-rev`}
                  id={`nd-arr-rev-${c}`}
                  viewBox="0 0 10 10"
                  refX="2"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                  markerUnits="userSpaceOnUse"
                >
                  <path
                    d="M2 1L8 5L2 9"
                    fill="none"
                    stroke={LINE[c] ?? "#ffffff"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </marker>
              ))}

              <filter id="nd-gl">
                <feGaussianBlur stdDeviation="2" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {edges.map((edge, idx) => {
              const ep = edgeEndpoints(edge);
              if (!ep) return null;
              const { lineStart, lineEnd } = ep;

              const col = edge.color ?? "gold";
              const dir = edge.direction ?? "forward";
              const isActive = activeEdge === idx || activeNode === edge.from || activeNode === edge.to;

              const markerEnd = (dir === "forward" || dir === "both") ? `url(#nd-arr-${col})` : undefined;
              const markerStart = (dir === "backward" || dir === "both") ? `url(#nd-arr-rev-${col})` : undefined;

              return (
                <line
                  key={idx}
                  x1={lineStart.x}
                  y1={lineStart.y}
                  x2={lineEnd.x}
                  y2={lineEnd.y}
                  stroke={LINE[col]}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={edge.dashed ? "7 5" : undefined}
                  strokeOpacity={isActive ? 0.9 : 0.28}
                  markerEnd={markerEnd}
                  markerStart={markerStart}
                  filter={isActive ? "url(#nd-gl)" : undefined}
                  style={{ transition: "stroke-opacity .2s, stroke-width .2s" }}
                />
              );
            })}
          </svg>
        </div>

        {/* Edge hover targets */}
        {edges.map((edge, idx) => {
          if (!edge.tooltip) return null;
          const mid = edgeMidFrame(edge);
          if (!mid) return null;
          return (
            <div key={idx}
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 cursor-help"
              style={{ left: mid.x, top: mid.y, zIndex: 10, pointerEvents: "all" }}
              onMouseEnter={() => handleEdgeEnter(edge, idx, mid.x, mid.y)}
              onMouseLeave={clearHover}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const vpos = positions[node.id];
          if (!vpos) return null;
          const fp = toFramePos(vpos);
          const c = COLOR[node.color];
          const Icon = node.icon;
          const isActive = activeNode === node.id ||
            edges.some((e, i) => activeEdge === i && (e.from === node.id || e.to === node.id));

          return (
            <div key={node.id}
              className={cn(
                "absolute rounded-xl border flex flex-col items-center gap-1 px-3 py-2.5",
                "transition-shadow duration-200 cursor-grab active:cursor-grabbing select-none",
                c.bg,
                c.border,
                node.dashed && "border-dashed"
              )}
              style={{
                left: fp.x, top: fp.y,
                transform: "translate(-50%,-50%)",
                width: CARD_W,
                zIndex: activeNode === node.id ? 30 : 20,
                boxShadow: isActive
                  ? `0 0 20px ${c.glow},0 0 6px rgba(0,0,0,0.6)`
                  : "0 2px 14px rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)",
                pointerEvents: "all",
                touchAction: "none",
              }}
              onMouseDown={(e) => onNodeMouseDown(node.id, e)}
              onMouseEnter={() => handleNodeEnter(node)}
              onMouseLeave={clearHover}
              onTouchStart={(e) => onNodeTouchStart(node.id, e)}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", c.bg, c.border)}>
                <Icon size={15} className={c.icon} />
              </div>
              <span className="text-amber-100/90 font-semibold text-center leading-tight"
                style={{ fontFamily: "var(--font-display)", fontSize: "0.65rem" }}>
                {node.label}
              </span>
              {node.sublabel && (
                <span className="text-amber-100/35 text-center leading-tight"
                  style={{ fontSize: "0.57rem", fontFamily: "var(--font-mono)" }}>
                  {node.sublabel}
                </span>
              )}
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute pointer-events-none z-40"
            style={{
              left: Math.min(Math.max(tooltip.fx + 14, 8), frameDims.w - 248),
              top: Math.min(Math.max(tooltip.fy - 60, 8), frameDims.h - 72),
            }}
          >
            <div className="rounded-lg border border-gold-600/30 bg-stone-950/96 px-3.5 py-2.5 text-amber-100/80 text-xs leading-relaxed"
              style={{
                maxWidth: 232,
                boxShadow: "0 4px 24px rgba(0,0,0,0.75),0 0 12px rgba(212,160,23,0.1)",
                fontFamily: "var(--font-body)", backdropFilter: "blur(14px)",
              }}
            >
              {tooltip.text}
            </div>
          </div>
        )}

        {title}
      </div>
    </div>
  );
}
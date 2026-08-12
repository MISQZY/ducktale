"use client";

import type { Node } from "@antv/x6";
import { cn } from "@/lib/utils";
import { DIAGRAM_COLOR } from "@/config/site";
import type { GraphNodeData } from "./types";

/**
 * Default X6 react-shape renderer for a graph node.
 * Re-rendered by x6-react-shape whenever `node.setData(...)` changes the
 * cell's `data` (registered with `effect: ["data"]` in shapes.ts) — position
 * changes during drag/pan do NOT trigger this, so dragging stays cheap.
 */
export function NodeCard({ node }: { node: Node }) {
  const data = node.getData<GraphNodeData>();
  const c = DIAGRAM_COLOR[data.color];
  const Icon = data.icon;

  return (
    <div
      className={cn(
        "h-full w-full rounded-xl border flex flex-col items-center justify-center gap-1 px-3 py-2.5",
        "select-none cursor-grab active:cursor-grabbing transition-shadow duration-200 overflow-hidden",
        c.bg,
        c.border,
        data.dashed && "border-dashed"
      )}
      style={{
        boxShadow: data.active
          ? `0 0 20px ${c.glow}, 0 0 6px rgba(0,0,0,0.6)`
          : "0 2px 14px rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", c.bg, c.border)}>
        <Icon size={15} className={c.icon} />
      </div>
      <span
        className="text-foreground/90 font-semibold text-center leading-tight line-clamp-1"
        style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem" }}
      >
        {data.label}
      </span>
      {data.sublabel && (
        <span
          className="text-foreground/35 text-center leading-tight line-clamp-2"
          style={{ fontSize: "0.57rem", fontFamily: "var(--font-mono)" }}
        >
          {data.sublabel}
        </span>
      )}
    </div>
  );
}

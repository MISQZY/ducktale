import { register } from "@antv/x6-react-shape";
import { DIAGRAM_LINE } from "@/config/site";
import { NodeCard } from "./NodeCard";
import type { EdgeDirection, LineColor } from "./types";

export const NODE_SHAPE = "graph-node-card";

register({
  shape: NODE_SHAPE,
  component: NodeCard,
  effect: ["data"],
});

// X6 always orients marker-end with an extra 180deg flip on top of the
// path's own `auto` tangent rotation, and leaves marker-start unrotated —
// so the path must be authored tip-left (matching their built-in `classic`
// preset) for both ends to come out pointing the right way after X6's
// rotation is applied.
const ARROW_PATH = "M 8 1 L 2 5 L 8 9";

export const EDGE_REST_WIDTH = 1.5;
export const EDGE_ACTIVE_WIDTH = 2.5;

// The marker's own strokeWidth (baked into its cached <marker> def, incl.
// the refX offset X6 derives from it) must track the line's strokeWidth —
// otherwise hover only thickens the shaft, leaving the arrowhead at its
// original thin offset so it visibly seams/overlaps the thicker line at
// some angles. Recomputing both together on hover keeps them matched.
export function edgeLineAttrs(
  color: LineColor | undefined,
  dashed: boolean | undefined,
  direction: EdgeDirection = "forward",
  active = false
) {
  const stroke = DIAGRAM_LINE[color ?? "gold"] ?? DIAGRAM_LINE.gold;
  const strokeWidth = active ? EDGE_ACTIVE_WIDTH : EDGE_REST_WIDTH;
  const marker = {
    name: "path" as const,
    d: ARROW_PATH,
    fill: "none",
    stroke,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return {
    stroke,
    strokeWidth,
    strokeOpacity: active ? 0.9 : 0.28,
    strokeDasharray: dashed ? "7 5" : undefined,
    targetMarker: direction === "forward" || direction === "both" ? marker : null,
    sourceMarker: direction === "backward" || direction === "both" ? marker : null,
  };
}

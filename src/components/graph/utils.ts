import type { Graph } from "@antv/x6";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Separates every rect in `positions` so none overlap, treating `fixedId`
 * as immovable (it follows the pointer during a drag) and letting all
 * others get pushed out of its way — including out of each other's way,
 * so a push doesn't just relocate the overlap onto a third node.
 *
 * Multi-pass: resolving one pair can reintroduce overlap in a pair already
 * cleared earlier in the same sweep, so this repeats until nothing moves
 * (or it gives up after a fixed number of passes).
 */
export function resolvePushCollisions(
  positions: Record<string, Rect>,
  fixedId: string,
  margin = 6
): Record<string, Rect> {
  const ids = Object.keys(positions);
  const next: Record<string, Rect> = {};
  for (const id of ids) next[id] = { ...positions[id] };

  for (let pass = 0; pass < 6; pass++) {
    let moved = false;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const idA = ids[i];
        const idB = ids[j];
        const a = next[idA];
        const b = next[idB];

        const ax = a.x - margin;
        const ay = a.y - margin;
        const aw = a.width + margin * 2;
        const ah = a.height + margin * 2;

        const overlapX = Math.min(ax + aw, b.x + b.width) - Math.max(ax, b.x);
        const overlapY = Math.min(ay + ah, b.y + b.height) - Math.max(ay, b.y);
        if (overlapX <= 0 || overlapY <= 0) continue;

        const aFixed = idA === fixedId;
        const bFixed = idB === fixedId;
        if (aFixed && bFixed) continue;

        moved = true;
        const axis = overlapX < overlapY ? "x" : "y";
        const overlap = axis === "x" ? overlapX : overlapY;
        const split = !aFixed && !bFixed;
        const pushA = aFixed ? 0 : split ? overlap / 2 : overlap;
        const pushB = bFixed ? 0 : split ? overlap / 2 : overlap;

        const aCenter = axis === "x" ? a.x + a.width / 2 : a.y + a.height / 2;
        const bCenter = axis === "x" ? b.x + b.width / 2 : b.y + b.height / 2;
        const aIsFirst = aCenter < bCenter;

        if (axis === "x") {
          if (!aFixed) a.x += aIsFirst ? -pushA : pushA;
          if (!bFixed) b.x += aIsFirst ? pushB : -pushB;
        } else {
          if (!aFixed) a.y += aIsFirst ? -pushA : pushA;
          if (!bFixed) b.y += aIsFirst ? pushB : -pushB;
        }
      }
    }

    if (!moved) break;
  }

  return next;
}

/**
 * Registers the "push everything else out of the way while a node is being
 * dragged (or resized)" behavior on a graph — GraphDiagram and QuestTree
 * each need this identically, just with different margins (and QuestTree
 * additionally needs it on `node:resized`, since QuestNodeCard auto-resizes
 * to fit its content while GraphDiagram's NodeCard is a fixed size).
 * No cleanup is returned: these listeners live and die with the graph
 * instance, which GraphCanvas already disposes of on unmount.
 */
export function wireNodeCollisionResolution(
  graph: Graph,
  options?: { margin?: number; onResize?: boolean }
): void {
  const margin = options?.margin ?? 6;

  const resolveCollisions = (sourceNodeId: string) => {
    const rects: Record<string, Rect> = {};
    for (const n of graph.getNodes()) rects[n.id] = { ...n.position(), ...n.size() };

    const resolved = resolvePushCollisions(rects, sourceNodeId, margin);
    for (const n of graph.getNodes()) {
      if (n.id === sourceNodeId) continue;
      const r = resolved[n.id];
      const cur = n.position();
      if (r.x !== cur.x || r.y !== cur.y) n.position(r.x, r.y);
    }
  };

  graph.on("node:moving", ({ node }) => resolveCollisions(node.id));
  if (options?.onResize) {
    graph.on("node:resized", ({ node }) => resolveCollisions(node.id));
  }
}

import { CANVAS_W, CANVAS_H, CARD_W, CARD_H, PAD, MIN_DIST, CX, CY } from "./constants";
import { Vec2 } from "./types";

export function toAbs(off: Vec2): Vec2 {
  return { x: CX + off.x, y: CY + off.y };
}

export function clampNode(x: number, y: number): Vec2 {
  return {
    x: Math.max(CARD_W / 2 + PAD, Math.min(CANVAS_W - CARD_W / 2 - PAD, x)),
    y: Math.max(CARD_H / 2 + PAD, Math.min(CANVAS_H - CARD_H / 2 - PAD, y)),
  };
}

export function toFrame(v: Vec2, frameDims: { w: number; h: number }, pan: Vec2): Vec2 {
  return {
    x: v.x + (frameDims.w / 2 - CX) + pan.x,
    y: v.y + (frameDims.h / 2 - CY) + pan.y,
  };
}

export function clampPan(px: number, py: number, fw: number, fh: number): Vec2 {
  return {
    x: Math.max(fw / 2 - CX, Math.min(CX - fw / 2, px)),
    y: Math.max(fh / 2 - CY, Math.min(CY - fh / 2, py)),
  };
}

export function resolveCollisions(
  positions: Record<string, Vec2>,
  draggingId: string | null
): Record<string, Vec2> {
  const ids  = Object.keys(positions);
  const next = { ...positions };

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j];
        const pa = next[a], pb = next[b];
        const dx   = pb.x - pa.x;
        const dy   = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (dist >= MIN_DIST) continue;

        const overlap = (MIN_DIST - dist) / 2;
        const nx = (dx / dist) * overlap;
        const ny = (dy / dist) * overlap;

        if (a !== draggingId) next[a] = clampNode(pa.x - nx, pa.y - ny);
        if (b !== draggingId) next[b] = clampNode(pb.x + nx, pb.y + ny);
      }
    }
  }

  return next;
}

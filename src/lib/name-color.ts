import type { CSSProperties } from "react";
import type { PlayerColor } from "@/types/player-card";

/**
 * The player's chat-color as a translucent gradient `background-image`,
 * meant to be layered over an element's own translucent background-color
 * (not swapped in as a separate opaque div) — a flat rectangle on top
 * fought the liquid-card glass effect (backdrop-blur showing through a
 * translucent background) instead of blending into it. Each stop goes
 * through color-mix so the gradient itself is translucent — the same
 * technique .liquid-card.bg-card already uses for its own tint — letting
 * the blurred backdrop and the element's own background both still show
 * through. Degenerate 2-stop gradient (same color twice) for the solid
 * case keeps this to one code path instead of branching between
 * background-color and background-image.
 *
 * Shared by ProfilePlayerCard, Navbar's account chip, and the homepage
 * showcase marquee — every surface that renders a player's chat-color.
 */
export function nameColorStyle(color: PlayerColor | null | undefined): CSSProperties | undefined {
  if (!color) return undefined;
  const stops = color.type === "gradient" ? color.stops : [color.color, color.color];
  return {
    backgroundImage: `linear-gradient(135deg, ${
      stops.map((hex) => `color-mix(in srgb, ${hex} 18%, transparent)`).join(", ")
    })`,
  };
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Resolves a PlayerColor to one flat hex, mixed with a neutral mid-tone
 * (--color-stone-600, #332f21) — for contexts that can't use nameColorStyle's
 * translucent CSS gradient at all, because there's no underlying page
 * background for `color-mix(..., transparent)` to composite against (a
 * WebGL <canvas> scene background is always fully opaque — see
 * SkinViewer3D.tsx's own doc comment). A gradient color averages all of its
 * stops into one representative hue rather than attempting to reproduce the
 * gradient itself, which a single scene-background color can't do anyway.
 *
 * Mixed toward a mid-tone gray, not near-black: blending any hue into a
 * dark-enough base is arithmetically identical to that hue at low alpha over
 * a black backdrop (accent*r + black*(1-r) === rgba(accent, r) on black) —
 * which was tried first (base #141209, the near-black surface color) and
 * came back looking "dirty" rather than tinted, because it's the same
 * washed-out-into-darkness result transparency would produce, just computed
 * a different way. A genuinely lighter, more neutral base gives the accent
 * hue something real to blend with instead of just fading into black, so it
 * reads as a deliberately mixed color rather than the color barely
 * surviving being dimmed.
 */
export function nameColorSolid(color: PlayerColor | null | undefined): string | null {
  if (!color) return null;
  const stops = color.type === "gradient" ? color.stops : [color.color];
  const rgbs = stops.map(parseHex);
  const avg: [number, number, number] = [
    rgbs.reduce((sum, c) => sum + c[0], 0) / rgbs.length,
    rgbs.reduce((sum, c) => sum + c[1], 0) / rgbs.length,
    rgbs.reduce((sum, c) => sum + c[2], 0) / rgbs.length,
  ];
  const base = parseHex("#332f21");
  const ratio = 0.3;
  const blended: [number, number, number] = [
    avg[0] * ratio + base[0] * (1 - ratio),
    avg[1] * ratio + base[1] * (1 - ratio),
    avg[2] * ratio + base[2] * (1 - ratio),
  ];
  return toHex(blended);
}

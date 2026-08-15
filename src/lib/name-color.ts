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

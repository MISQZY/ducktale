"use client";

import { memo, useEffect, useRef, type CSSProperties } from "react";
import { VineBranch, VineDefs, growVine, type GrownVine, type GrowthSpec, type Stem } from "./vine-art";
import { createVineMotion } from "./vine-motion";

/**
 * Golden vines framing the landing hero: an arc running inward along the top of
 * each corner, and a cascade falling down each side edge.
 *
 * Mounted as a sibling of <main>, deliberately NOT inside <section id="hero">.
 * The hero sets `overflow-hidden` for its background glows, which clips to its
 * padding box — so a vine living inside it gets sheared off flat at the top of
 * the page. That cut is visible through the translucent navbar, and on a
 * rubber-band overscroll the hero's top edge (and the clip with it) travels
 * down and puts the sheared ends on full display. Outside the hero there is no
 * such clip: the field starts above the document origin, the trunks are drawn
 * running further up still, and the overscroll band shows vine instead of a cut.
 *
 * Motion is split across two nested elements per piece: `.vine-piece` carries
 * the JS-written parallax transform, `.vine-sway` carries the CSS wind
 * keyframes. One element cannot hold both — whichever wrote last would erase
 * the other.
 */

// Trunks start above y=0 so there is real art in the overscroll band rather
// than a stem that begins exactly where the page does.
const ARC_VIEWBOX = "0 0 760 340";
const ARC_RATIO = "760 / 340";

/** Enters at the outer corner and sweeps inward, descending as it goes. Authored for the left side; the right is this mirrored. */
const TRUNK_ARC: Stem = {
  start: [26, -74],
  segments: [
    [[96, 6], [196, 52], [326, 92]],
    [[452, 130], [576, 174], [700, 244]],
  ],
};

/** Falls from the top edge and hugs the side, drifting outward as it drops. */
const CASCADE_VIEWBOX = "0 0 260 920";
const CASCADE_RATIO = "260 / 920";

const TRUNK_CASCADE: Stem = {
  start: [172, -80],
  segments: [
    [[138, 96], [104, 232], [116, 358]],
    [[126, 486], [82, 610], [60, 742]],
    [[48, 820], [40, 872], [32, 914]],
  ],
};

/**
 * Growth is what makes these read as the reference art rather than as a wire
 * with leaves stuck on: two generations of children off the trunk, each shorter,
 * thinner and droopier than its parent, with curls on the tips.
 */
const ARC_SPEC: GrowthSpec = {
  levels: 2,
  children: [5, 3],
  leafSpacing: [86, 46, 29],
  lengthFalloff: [0.28, 0.34],
  trunkLength: 780,
  spread: 26,
  droop: 58,
  leafSize: [23, 37],
  tendrilChance: 0.85,
  tendrilRadius: 17,
  bareRoot: 0.05,
};

const CASCADE_SPEC: GrowthSpec = {
  levels: 2,
  children: [5, 3],
  leafSpacing: [86, 46, 29],
  lengthFalloff: [0.24, 0.34],
  trunkLength: 960,
  spread: 30,
  droop: 78,
  leafSize: [23, 37],
  tendrilChance: 0.85,
  tendrilRadius: 17,
  bareRoot: 0.04,
};

/**
 * Phone width gets its own small asset rather than the arc scaled down.
 *
 * Reusing the arc geometry — which this did first — fails twice over. Two arcs
 * wide enough to reach in from each corner overlap in the middle of a 375px
 * screen and pile their foliage into one clump dead centre, leaving the corners
 * bare; and the 0.22 scale factor needed to fit means leaf sizes have to be
 * inflated past a third of the viewBox height to survive, at which point there
 * are four enormous leaves instead of a vine.
 *
 * A trunk authored into a small box keeps its scale factor near 1, so leaf
 * sizes stay sane, and it is short enough that the two corners never meet.
 */
const CORNER_VIEWBOX = "0 0 200 220";
const CORNER_RATIO = "200 / 220";

const TRUNK_CORNER: Stem = {
  start: [26, -44],
  segments: [
    [[54, 24], [86, 58], [118, 86]],
    [[146, 112], [170, 150], [182, 200]],
  ],
};

const CORNER_SPEC: GrowthSpec = {
  levels: 2,
  children: [3, 2],
  leafSpacing: [50, 24, 15],
  // Short children on purpose. Branches paint well past the trunk's own box, and
  // at phone width that overshoot is what closes the gap the two corner sprays
  // are supposed to leave down the middle of the screen.
  lengthFalloff: [0.26, 0.34],
  trunkLength: 250,
  spread: 30,
  droop: 22,
  leafSize: [17, 26],
  tendrilChance: 0.8,
  tendrilRadius: 14,
  bareRoot: 0.06,
};

interface PieceConfig {
  key: string;
  trunk: Stem;
  viewBox: string;
  ratio: string;
  spec: GrowthSpec;
  trunkWidth: number;
  /** Sway pivot, as a position in the piece's box. The vine hangs from its trunk's entry point, so that is where it has to turn. */
  originLeft: string;
  originRight: string;
  swayDeg: string;
  period: string;
  /** Second, slower harmonic on the whole tree — see `.vine-wind` in globals.css. */
  windPeriod: string;
}

const PIECES: readonly PieceConfig[] = [
  {
    key: "arc",
    trunk: TRUNK_ARC,
    viewBox: ARC_VIEWBOX,
    ratio: ARC_RATIO,
    spec: ARC_SPEC,
    trunkWidth: 10,
    // Trunk enters at x=26 of 760 — about 3% in.
    originLeft: "3% 0",
    originRight: "97% 0",
    swayDeg: "1.5deg",
    period: "11s",
    windPeriod: "7s",
  },
  {
    key: "cascade",
    trunk: TRUNK_CASCADE,
    viewBox: CASCADE_VIEWBOX,
    ratio: CASCADE_RATIO,
    spec: CASCADE_SPEC,
    trunkWidth: 9.5,
    // Trunk enters at x=172 of 260 — about 66% in.
    originLeft: "66% 0",
    originRight: "34% 0",
    swayDeg: "1.8deg",
    period: "14s",
    windPeriod: "9s",
  },
];

/** Thinned-out growth for the background layer: it sits at a quarter opacity behind the near layer, so full density there is bytes in the HTML nobody can see. */
function sparse(spec: GrowthSpec): GrowthSpec {
  return {
    ...spec,
    children: [3, 2],
    leafSpacing: spec.leafSpacing.map((v) => v * 2.2),
    tendrilChance: 0.35,
  };
}

interface LayerConfig {
  key: string;
  ink: number;
  /**
   * Cursor parallax multiplier. Near layers shift MORE — closer things sweep
   * further across the view when the viewpoint moves.
   */
  depth: number;
  /**
   * Scroll parallax multiplier, and deliberately the inverse ranking of
   * `depth`: on a scrolling page distant things appear to move *less*, so the
   * far layer is the one that lags hardest against the page.
   */
  lag: number;
  widthScale: number;
  delay: string;
  glow: boolean;
  thin: boolean;
}

const LAYERS: readonly LayerConfig[] = [
  { key: "far", ink: 0.3, depth: 0.4, lag: 1, widthScale: 0.72, delay: "-5.5s", glow: false, thin: true },
  { key: "near", ink: 0.95, depth: 1, lag: 0.28, widthScale: 1, delay: "0s", glow: true, thin: false },
];

/**
 * Every tree is grown once at module scope, not per render. It is pure seeded
 * maths, so the server and every client agree on the result — and each piece,
 * layer and side gets its own seed, so the mirrored right-hand side is a
 * genuinely different plant on the same silhouette rather than a photocopy.
 */
const SIDES = ["left", "right"] as const;
type Side = (typeof SIDES)[number];

const GROWN: Record<string, GrownVine> = {};
let seed = 20260816;
for (const piece of PIECES) {
  for (const layer of LAYERS) {
    for (const side of SIDES) {
      const spec = layer.thin ? sparse(piece.spec) : piece.spec;
      GROWN[`${piece.key}-${layer.key}-${side}`] = growVine(piece.trunk, spec, (seed += 7919));
    }
  }
}
const CORNER_PIECE: PieceConfig = {
  key: "corner",
  trunk: TRUNK_CORNER,
  viewBox: CORNER_VIEWBOX,
  ratio: CORNER_RATIO,
  spec: CORNER_SPEC,
  trunkWidth: 5.5,
  // Trunk enters at x=26 of 200 — about 13% in.
  originLeft: "13% 0",
  originRight: "87% 0",
  swayDeg: "1deg",
  period: "11s",
  windPeriod: "7.5s",
};

const GROWN_MOBILE: Record<Side, GrownVine> = {
  left: growVine(TRUNK_CORNER, CORNER_SPEC, 4471103),
  right: growVine(TRUNK_CORNER, CORNER_SPEC, 9928357),
};

const VinePiece = memo(function VinePiece({
  piece,
  layer,
  side,
  vine,
  extraClass = "",
}: {
  piece: PieceConfig;
  layer: LayerConfig;
  side: Side;
  vine: GrownVine;
  extraClass?: string;
}) {
  return (
    <div
      className={`vine-piece vine-piece-${piece.key} vine-piece-${side}${extraClass}`}
      style={
        {
          aspectRatio: piece.ratio,
          "--vine-depth": layer.depth,
          "--vine-lag": layer.lag,
        } as CSSProperties
      }
    >
      <div
        className="vine-sway"
        style={
          {
            "--vine-sway": piece.swayDeg,
            "--vine-wind-period": piece.windPeriod,
            animationDuration: piece.period,
            animationDelay: layer.delay,
            transformOrigin: side === "left" ? piece.originLeft : piece.originRight,
          } as CSSProperties
        }
      >
        <svg
          viewBox={piece.viewBox}
          className={`vine-svg${side === "right" ? " vine-mirror" : ""}${layer.glow ? " vine-glow" : ""}`}
          style={{ "--vine-ink": layer.ink } as CSSProperties}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <VineBranch vine={vine} trunkWidth={piece.trunkWidth * layer.widthScale} />
        </svg>
      </div>
    </div>
  );
});

export const HeaderVines = memo(function HeaderVines() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    // Nothing is wired up under reduced-motion: the CSS separately freezes the
    // wind keyframes, so the vines just hang there as static ornament rather
    // than being driven by a loop nobody asked for.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Collect every .vine-piece once and cache its per-piece depth/lag
    // multipliers so the per-frame loop does not touch computed styles at all.
    const pieces = Array.from(field.querySelectorAll<HTMLElement>(".vine-piece"));
    const pieceData = pieces.map((el) => {
      const cs = getComputedStyle(el);
      return {
        el,
        depth: parseFloat(cs.getPropertyValue("--vine-depth")) || 0,
        lag: parseFloat(cs.getPropertyValue("--vine-lag")) || 0,
      };
    });

    // Instead of writing CSS custom properties on the field and letting every
    // child recalculate `calc(var(--vine-x) * var(--vine-depth))` (which
    // triggers style recalculation across the entire SVG subtree on every
    // frame), we write `style.transform` directly on each piece. An element
    // with `will-change: transform` hands that write straight to the compositor
    // — no style recalc, no layout, no paint on any descendant.
    const motion = createVineMotion({
      apply: ({ x, y, scroll, fade }) => {
        for (const p of pieceData) {
          const tx = (x * p.depth).toFixed(2);
          const ty = (y * p.depth + scroll * p.lag).toFixed(2);
          p.el.style.transform = `translate3d(${tx}px,${ty}px,0)`;
        }
        field.style.opacity = fade.toFixed(3);
      },
      schedule: (callback) => requestAnimationFrame(callback),
      cancel: (handle) => cancelAnimationFrame(handle),
    });

    const handlePointerMove = (event: PointerEvent) => {
      // Touch drags would jerk the vines by however far the finger travelled;
      // only a real cursor drives the parallax.
      if (event.pointerType !== "mouse") return;
      motion.pointer(event.clientX, event.clientY, window.innerWidth, window.innerHeight);
    };

    const handleScroll = () => motion.scroll(window.scrollY);

    const observer = new IntersectionObserver(([entry]) => motion.visible(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(field);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Seed the scroll-driven vars up front: a reload partway down the page would
    // otherwise paint the vines at their un-scrolled position for a beat.
    motion.scroll(window.scrollY);
    motion.sync();

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      motion.dispose();
    };
  }, []);

  return (
    <div ref={fieldRef} className="vine-field" aria-hidden="true">
      <VineDefs />

      {PIECES.map((piece) =>
        LAYERS.map((layer) =>
          SIDES.map((side) => (
            <VinePiece
              key={`${piece.key}-${layer.key}-${side}`}
              piece={piece}
              layer={layer}
              side={side}
              vine={GROWN[`${piece.key}-${layer.key}-${side}`]}
              extraClass=" vine-desktop-only"
            />
          )),
        ),
      )}

      {/* Phone-width stand-in for the whole frame: one arc per corner, single
          layer. Which set is on screen is a CSS decision (see the
          .vine-desktop-only / .vine-mobile-only gates), so both ship in the
          markup — branching on a media query in JS would cost a resize listener
          and a hydration mismatch to save four small SVGs. */}
      {SIDES.map((side) => (
        <VinePiece
          key={`corner-${side}`}
          piece={CORNER_PIECE}
          layer={LAYERS[1]}
          side={side}
          vine={GROWN_MOBILE[side]}
          extraClass=" vine-mobile-only"
        />
      ))}
    </div>
  );
});

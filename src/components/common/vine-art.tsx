/**
 * SVG geometry for HeaderVines (src/components/common/HeaderVines.tsx) — the
 * golden vines framing the landing hero.
 *
 * The ornate, filigree look comes from recursion, not from hand-drawing: a
 * trunk sprouts children off itself, those sprout their own, and each level
 * gets thinner, shorter and droopier. Two generations of children is enough to
 * read as a real plant, and it means the whole silhouette is tuned with a
 * handful of numbers instead of a few hundred hand-placed path commands.
 *
 * Everything a branch tree produces is flattened into a handful of paths — one
 * per depth level for the stems, a few opacity buckets for the leaflets, one
 * for the tendrils — so a tree of ~21 branches carrying ~170 leaflets costs
 * about seven DOM nodes instead of hundreds. That matters: ten of these trees
 * are on the page at once, and together they are ~720 leaflets in ~90 nodes.
 *
 * The jitter is seeded (mulberry32), never Math.random(). This renders on the
 * server too, and an unseeded generator would hand the client a different plant
 * than the markup it is hydrating.
 */

export type Pt = readonly [number, number];

/** Control point 1, control point 2, end point — a cubic continuing from wherever the previous segment ended. */
export type CubicSegment = readonly [Pt, Pt, Pt];

export interface Stem {
  readonly start: Pt;
  readonly segments: readonly CubicSegment[];
}

const RAD = Math.PI / 180;

/**
 * Compact number formatter for path data. One decimal, no trailing ".0", no
 * leading zero on fractions ("-.5" not "-0.5").
 *
 * This is not micro-optimisation for its own sake: there are around a thousand
 * leaflets on the page and every one is a subpath in the server-rendered HTML.
 * Together with relative commands (see `leafletSubpath`) it is the difference
 * between the ornament costing ~170KB of markup and ~60KB.
 */
function n(v: number): string {
  const s = (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, "");
  return s.startsWith("0.") ? s.slice(1) : s.startsWith("-0.") ? `-${s.slice(2)}` : s;
}

/** Joins path numbers, dropping the separator before a negative — the minus sign already separates them. */
function seq(...values: number[]): string {
  return values
    .map(n)
    .reduce((acc, v, i) => (i === 0 ? v : acc + (v.startsWith("-") ? "" : " ") + v), "");
}

// ── Curve maths ───────────────────────────────────────────────────────────

function cubicPoint(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

function cubicTangent(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return [
    3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
}

export function stemPath({ start, segments }: Stem): string {
  return (
    `M ${n(start[0])} ${n(start[1])} ` +
    segments
      .map(
        ([c1, c2, end]) =>
          `C ${n(c1[0])} ${n(c1[1])}, ${n(c2[0])} ${n(c2[1])}, ${n(end[0])} ${n(end[1])}`,
      )
      .join(" ")
  );
}

export interface StemSample {
  x: number;
  y: number;
  /** Tangent direction in degrees, 0 = along +x. */
  angle: number;
}

/**
 * Point + tangent at `t` (0 = root, 1 = tip) across the whole segment chain.
 *
 * Parameterised uniformly in segment-index space rather than by arc length. The
 * stems here are authored with segments of comparable length, and true
 * arc-length parameterisation needs numeric integration to buy a difference
 * nobody can see on a background ornament.
 */
export function sampleStem({ start, segments }: Stem, t: number): StemSample {
  const scaled = Math.min(Math.max(t, 0), 0.999999) * segments.length;
  const index = Math.floor(scaled);
  const local = scaled - index;

  const p0 = index === 0 ? start : segments[index - 1][2];
  const [p1, p2, p3] = segments[index];

  const [x, y] = cubicPoint(p0, p1, p2, p3, local);
  const [tx, ty] = cubicTangent(p0, p1, p2, p3, local);
  return { x, y, angle: Math.atan2(ty, tx) / RAD };
}

/** Seeded PRNG — see the file header for why this can't be Math.random(). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Leaflet ───────────────────────────────────────────────────────────────

/**
 * One leaflet, as control points in a unit frame: base at the origin, tip at
 * (0, 1), widest around the middle. A pointed lens rather than the lobed grape
 * leaf this file used to draw — the reference art carries small simple
 * leaflets in pairs, and a simple oval is also the shape that survives being
 * 8px tall, which is what most of these end up being.
 */
const LEAFLET_HALF_WIDTH = 0.34;
/**
 * Controls sit OUTSIDE the intended half-width: a cubic reaches only about
 * three quarters of the way to its control points, so offsets equal to the
 * half-width produce a blade a quarter narrower than asked for. Pulling them
 * inward instead — which this did at first — yields a blade a third as wide as
 * it is long, i.e. a needle, and a canopy of needles reads as a thorn bush.
 */
const LEAFLET_CONTROLS: readonly Pt[] = [
  [LEAFLET_HALF_WIDTH * 1.32, 0.16],
  [LEAFLET_HALF_WIDTH * 1.18, 0.7],
  [0, 1],
  [-LEAFLET_HALF_WIDTH * 1.18, 0.7],
  [-LEAFLET_HALF_WIDTH * 1.32, 0.16],
];

/**
 * A leaflet as a closed subpath in the parent's coordinates.
 *
 * Emitted with the transform already baked into the numbers rather than as a
 * `transform` attribute, because these get concatenated into one shared `d` —
 * see the file header on why the whole canopy is a single path.
 *
 * `deg` is measured from straight down, so 0 hangs the leaflet vertically.
 */
export function leafletSubpath(x: number, y: number, deg: number, size: number): string {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  /** Local control point as an offset from the leaflet's base. */
  const d = ([px, py]: Pt): Pt => [(px * c - py * s) * size, (px * s + py * c) * size];

  const [c1, c2, tip, c3, c4] = LEAFLET_CONTROLS.map(d);
  return (
    `M${seq(x, y)}` +
    // Base out to the tip.
    `c${seq(c1[0], c1[1], c2[0], c2[1], tip[0], tip[1])}` +
    // Tip back to the base. Relative cubics measure from the segment's own
    // start, which is now the tip, so these subtract it out.
    `c${seq(c3[0] - tip[0], c3[1] - tip[1], c4[0] - tip[0], c4[1] - tip[1], -tip[0], -tip[1])}z`
  );
}

/** World direction `phi` (degrees from +x) expressed as a leaflet rotation, which is measured from straight down. */
const towards = (phi: number): number => phi - 90;

/**
 * A curling tendril: a short lead-in, then a spiral that tightens as it coils.
 * Emitted as a dense polyline — smooth enough at these sizes and far less
 * fiddly than fitting Béziers to a spiral.
 */
export function tendrilSubpath(
  x: number,
  y: number,
  deg: number,
  radius: number,
  turns: number,
  lead: number,
): string {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  const at = (px: number, py: number): string => `${n(x + (px * c - py * s))} ${n(y + (px * s + py * c))}`;

  const steps = Math.max(14, Math.round(turns * 15));
  const sweep = turns * Math.PI * 2;
  const centerY = lead + radius;

  let d = `M ${n(x)} ${n(y)} L ${at(0, lead)}`;
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * sweep;
    const r = radius * (1 - (i / steps) * 0.76);
    d += ` L ${at(Math.sin(a) * r, centerY - Math.cos(a) * r)}`;
  }
  return d;
}

// ── Growth ────────────────────────────────────────────────────────────────

export interface GrowthSpec {
  /** How many generations of children to sprout. 0 renders the trunk alone. */
  levels: number;
  /** Children sprouted per branch, per generation. */
  children: readonly number[];
  /**
   * Distance between leaflet pairs along a branch, in viewBox units, per
   * generation — a spacing, not a count. A fixed count per branch is what made
   * the first version read as bare thorny scrub: the same four pairs spread
   * over a 780-unit trunk and a 90-unit twig leave the long branches almost
   * empty. Spacing keeps leaf density constant no matter the branch length, and
   * going coarse on the trunk and fine on the twigs is also what the reference
   * does — the heavy stems are mostly bare, the filigree carries the foliage.
   */
  leafSpacing: readonly number[];
  /** Child length as a fraction of the parent's, per generation. */
  lengthFalloff: readonly number[];
  /** Trunk length, in viewBox units, used to scale the first generation. */
  trunkLength: number;
  /** Angle a child leaves its parent at, off the parent's tangent. */
  spread: number;
  /** How far a branch is pulled downward over its length — gravity, basically. */
  droop: number;
  /** Leaflet size range, in viewBox units. */
  leafSize: readonly [number, number];
  /** Fraction of branch tips that finish in a curl. */
  tendrilChance: number;
  tendrilRadius: number;
  /** Stretch of the trunk left bare, so it reads as emerging from off-screen. */
  bareRoot: number;
}

/** Everything one tree draws, flattened. Indices of `stems` are depth levels; indices of `leaflets` are brightness buckets. */
export interface GrownVine {
  stems: string[];
  leaflets: string[];
  tendrils: string;
}

export const LEAFLET_BUCKETS = 3;

/**
 * Leaflets sit in opposite pairs along a branch and mostly hang downward: the
 * pair direction is perpendicular to the branch, then blended a third of the
 * way toward straight down, because gravity beats phyllotaxis and a canopy
 * whose leaves all point along their twigs looks like a diagram.
 */
function addLeaflets(
  out: string[],
  stem: Stem,
  spec: GrowthSpec,
  depth: number,
  rand: () => number,
  sizeScale: number,
  length: number,
): void {
  const spacing = spec.leafSpacing[Math.min(depth, spec.leafSpacing.length - 1)];
  const pairs = Math.max(1, Math.round(length / spacing));
  if (spacing <= 0) return;

  const from = depth === 0 ? spec.bareRoot : 0.12;
  const [minSize, maxSize] = spec.leafSize;

  for (let i = 0; i < pairs; i++) {
    const t = from + (1 - from) * ((i + 0.5) / pairs + (rand() - 0.5) * 0.4 / pairs);
    const { x, y, angle } = sampleStem(stem, t);

    for (const side of [1, -1]) {
      const perpendicular = angle + side * (72 + rand() * 22);
      const phi = perpendicular + (90 - perpendicular) * 0.32;
      // Leaflets shrink toward the tip of their branch — new growth.
      const size = (minSize + (maxSize - minSize) * Math.pow(rand(), 0.7)) * sizeScale * (1 - t * 0.28);
      const bucket = Math.min(LEAFLET_BUCKETS - 1, Math.floor(rand() * LEAFLET_BUCKETS));
      out[bucket] += leafletSubpath(x, y, towards(phi) + (rand() - 0.5) * 34, size) + " ";
    }
  }
}

/**
 * A child branch leaving `from` at `phi`, bending downward as it goes. The
 * second segment is what gives the tips their hook — a branch that ends on a
 * straight tangent reads as a wire.
 */
function childStem(from: StemSample, phi: number, length: number, droop: number, bow: number): Stem {
  const a = phi * RAD;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  // Perpendicular to the branch, so `bow` swings it sideways into an arc
  // instead of letting it leave as a straight spine.
  const px = -dy;
  const py = dx;
  const sweep = length * bow;

  const mid: Pt = [
    from.x + dx * length * 0.56 + px * sweep * 0.55,
    from.y + dy * length * 0.56 + py * sweep * 0.55 + droop * 0.3,
  ];
  const end: Pt = [from.x + dx * length + px * sweep, from.y + dy * length + py * sweep + droop];

  return {
    start: [from.x, from.y],
    segments: [
      [
        [from.x + dx * length * 0.2, from.y + dy * length * 0.2],
        [from.x + dx * length * 0.38 + px * sweep * 0.22, from.y + dy * length * 0.38 + py * sweep * 0.22 + droop * 0.08],
        mid,
      ],
      [
        // Overshoots the end tangentially, which is what hooks the tip over
        // rather than letting the branch stop dead.
        [mid[0] + dx * length * 0.28 + px * sweep * 0.5, mid[1] + dy * length * 0.28 + py * sweep * 0.5 + droop * 0.4],
        [end[0] - px * sweep * 0.28, end[1] - droop * 0.1],
        end,
      ],
    ],
  };
}

export function growVine(trunk: Stem, spec: GrowthSpec, seed: number): GrownVine {
  const rand = mulberry32(seed);
  const stems: string[] = Array.from({ length: spec.levels + 1 }, () => "");
  const leaflets: string[] = Array.from({ length: LEAFLET_BUCKETS }, () => "");
  let tendrils = "";

  const grow = (stem: Stem, depth: number, length: number, sizeScale: number): void => {
    stems[depth] += stemPath(stem) + " ";
    addLeaflets(leaflets, stem, spec, depth, rand, sizeScale, length);

    if (depth >= spec.levels) {
      // Tips are where the curls belong — a tendril halfway along a trunk just
      // looks like a knot.
      if (rand() < spec.tendrilChance) {
        const tip = sampleStem(stem, 0.995);
        tendrils +=
          tendrilSubpath(
            tip.x,
            tip.y,
            towards(tip.angle + (rand() - 0.5) * 30),
            spec.tendrilRadius * sizeScale * (0.7 + rand() * 0.6),
            1.7 + rand() * 1.3,
            4 + rand() * 6,
          ) + " ";
      }
      return;
    }

    const count = spec.children[Math.min(depth, spec.children.length - 1)];
    const falloff = spec.lengthFalloff[Math.min(depth, spec.lengthFalloff.length - 1)];
    const from = depth === 0 ? spec.bareRoot : 0.16;

    for (let i = 0; i < count; i++) {
      const t = from + (1 - from) * ((i + 0.6) / count + (rand() - 0.5) * 0.5 / count);
      const at = sampleStem(stem, t);
      const side = i % 2 === 0 ? 1 : -1;
      const phi = at.angle + side * spec.spread * (0.6 + rand() * 0.8);
      const childLength = length * falloff * (0.7 + rand() * 0.6);

      grow(
        childStem(at, phi, childLength, spec.droop * falloff * (0.5 + rand()), (rand() - 0.45) * 1.3),
        depth + 1,
        childLength,
        sizeScale * 0.86,
      );
    }
  };

  grow(trunk, 0, spec.trunkLength, 1);
  return { stems, leaflets, tendrils };
}

// ── Shared gradient defs ──────────────────────────────────────────────────

/**
 * Rendered exactly once per page (HeaderVines mounts it); every vine <svg>
 * references these by fragment id. Repeating the defs inside each SVG would
 * mean a dozen elements sharing each id — which happens to resolve to the
 * first, but is invalid markup and a trap for whoever next edits a gradient
 * and watches eleven of them ignore it.
 *
 * Stop colours are CSS custom properties so the light theme can re-point them
 * at deeper golds in globals.css rather than needing a second copy of this.
 */
export function VineDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="vine-stem" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="var(--vine-gold-mid)" />
          <stop offset="45%" stopColor="var(--vine-gold-light)" />
          <stop offset="100%" stopColor="var(--vine-gold-deep)" />
        </linearGradient>

        {/* Laid over the trunk at a narrower width to fake a specular streak —
            two flat strokes read as metal far more cheaply than any filter. */}
        <linearGradient id="vine-sheen" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="var(--vine-gold-pale)" stopOpacity="0.9" />
          <stop offset="55%" stopColor="var(--vine-gold-light)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--vine-gold-light)" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="vine-leaf" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="var(--vine-gold-pale)" />
          <stop offset="38%" stopColor="var(--vine-gold-light)" />
          <stop offset="100%" stopColor="var(--vine-gold-mid)" />
        </linearGradient>

        <linearGradient id="vine-tendril" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--vine-gold-light)" />
          <stop offset="100%" stopColor="var(--vine-gold-mid)" stopOpacity="0.15" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Branch ────────────────────────────────────────────────────────────────

/** Brightness of each leaflet bucket. Uniformly lit leaves read as a printed pattern; a spread of three gives the canopy depth for two extra DOM nodes. */
const BUCKET_OPACITY = [0.55, 0.78, 1];

export interface VineBranchProps {
  vine: GrownVine;
  /** Trunk stroke width. Each generation thins from here, which is most of what makes the tree read as filigree rather than as wire. */
  trunkWidth: number;
}

export function VineBranch({ vine, trunkWidth }: VineBranchProps) {
  return (
    <g className="vine-wind">
      {vine.stems.map((d, depth) =>
        d ? (
          <path
            key={`stem-${depth}`}
            d={d}
            fill="none"
            stroke="url(#vine-stem)"
            strokeWidth={trunkWidth * Math.pow(0.52, depth)}
            strokeLinecap="round"
          />
        ) : null,
      )}

      {/* Sheen only on the two heaviest levels — on a hairline twig it would
          simply overwrite the stem it is supposed to be catching light on. */}
      {vine.stems.slice(0, 2).map((d, depth) =>
        d ? (
          <path
            key={`sheen-${depth}`}
            d={d}
            fill="none"
            stroke="url(#vine-sheen)"
            strokeWidth={trunkWidth * Math.pow(0.52, depth) * 0.34}
            strokeLinecap="round"
          />
        ) : null,
      )}

      {vine.tendrils ? (
        <path
          d={vine.tendrils}
          fill="none"
          stroke="url(#vine-tendril)"
          strokeWidth={trunkWidth * 0.46}
          strokeLinecap="round"
        />
      ) : null}

      {vine.leaflets.map((d, bucket) =>
        d ? (
          <path key={`leaf-${bucket}`} d={d} fill="url(#vine-leaf)" opacity={BUCKET_OPACITY[bucket]} />
        ) : null,
      )}
    </g>
  );
}

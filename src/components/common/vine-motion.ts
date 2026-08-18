/**
 * The motion state machine behind HeaderVines — cursor easing, scroll drift and
 * fade, and the decision about when to stop asking for frames.
 *
 * Split out of the component for two reasons. It is the only part of the
 * ornament with behaviour rather than shape, and inside a `useEffect` closure
 * none of it can be exercised: a hidden document (which is what every headless
 * and preview renderer gives you) never fires requestAnimationFrame at all, so
 * the loop simply never runs there. With the scheduler injected, the same code
 * that ships can be stepped frame by frame and checked.
 */

export interface VineMotionState {
  /** Cursor offset in px, already eased toward the pointer. */
  x: number;
  y: number;
  /** How far the vines lag behind the page, in px. */
  scroll: number;
  /** Opacity multiplier, 1 at the top of the page down to FADE_FLOOR. */
  fade: number;
}

export interface VineMotionOptions {
  /** Called at most once per frame, and only when a value actually changed. */
  apply: (state: VineMotionState) => void;
  schedule: (callback: () => void) => number;
  cancel: (handle: number) => void;
}

export interface VineMotion {
  /** Feed a cursor position; viewport size is passed in so this stays free of globals. */
  pointer: (clientX: number, clientY: number, width: number, height: number) => void;
  scroll: (scrollY: number) => void;
  /** Off-screen vines stop asking for frames entirely. */
  visible: (isVisible: boolean) => void;
  /** Push the current state through `apply` without waiting for a frame. */
  sync: () => void;
  dispose: () => void;
  /** Test seam: the state as of the last applied frame. */
  peek: () => VineMotionState & { running: boolean };
}

/** How far the cursor can push the nearest layer. Small on purpose — this is depth cueing at the edge of vision, not a carousel. */
export const POINTER_RANGE_X = 18;
export const POINTER_RANGE_Y = 10;
/** Scroll distance over which the drift and the fade play out. */
export const SCROLL_RANGE = 620;
export const SCROLL_DRIFT = 110;
/** Vines never fade out completely; they are still part of the composition. */
export const FADE_FLOOR = 0.08;
/** Fraction of the eased distance covered per frame. */
export const EASING = 0.06;
/** Below this the cursor has arrived; keeping the loop alive past it burns a frame every 16ms to move a sub-pixel. */
export const SETTLE_EPSILON = 0.05;

export function createVineMotion({ apply, schedule, cancel }: VineMotionOptions): VineMotion {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let scrolled = 0;

  let handle = 0;
  let running = false;
  let onScreen = true;
  let lastStamp = "";

  const state = (): VineMotionState => {
    const progress = Math.min(scrolled / SCROLL_RANGE, 1);
    return {
      x: currentX,
      y: currentY,
      scroll: progress * SCROLL_DRIFT,
      fade: 1 - (1 - FADE_FLOOR) * Math.min(scrolled / (SCROLL_RANGE * 0.85), 1),
    };
  };

  // Stamped and compared before applying, so a frame that changed nothing —
  // every frame of a still page whose cursor has already settled — costs no
  // style writes at all.
  const flush = (): void => {
    const next = state();
    const stamp = `${next.x.toFixed(2)} ${next.y.toFixed(2)} ${next.scroll.toFixed(2)} ${next.fade.toFixed(3)}`;
    if (stamp === lastStamp) return;
    lastStamp = stamp;
    apply(next);
  };

  const frame = (): void => {
    currentX += (targetX - currentX) * EASING;
    currentY += (targetY - currentY) * EASING;
    flush();

    if (
      Math.abs(targetX - currentX) < SETTLE_EPSILON &&
      Math.abs(targetY - currentY) < SETTLE_EPSILON
    ) {
      // Snap the remaining sub-pixel so the resting position is exact rather
      // than asymptotically close, then park.
      currentX = targetX;
      currentY = targetY;
      flush();
      running = false;
      return;
    }
    handle = schedule(frame);
  };

  const kick = (): void => {
    if (running || !onScreen) return;
    running = true;
    handle = schedule(frame);
  };

  return {
    pointer(clientX, clientY, width, height) {
      if (width <= 0 || height <= 0) return;
      targetX = (clientX / width - 0.5) * 2 * POINTER_RANGE_X;
      targetY = (clientY / height - 0.5) * 2 * POINTER_RANGE_Y;
      kick();
    },

    scroll(scrollY) {
      scrolled = Math.max(scrollY, 0);
      kick();
    },

    visible(isVisible) {
      onScreen = isVisible;
      if (isVisible) {
        kick();
      } else if (running) {
        cancel(handle);
        running = false;
      }
    },

    sync: flush,

    dispose() {
      if (running) cancel(handle);
      running = false;
    },

    peek: () => ({ ...state(), running }),
  };
}

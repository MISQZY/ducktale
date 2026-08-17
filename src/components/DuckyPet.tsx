"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { DUCKY_EASTER_EGG_HOST } from "@/config/servers";

const SPRITE_SIZE = 48;
const DISPLAY_SCALE = 1.5;
const DISPLAY_SIZE = SPRITE_SIZE * DISPLAY_SCALE;

const IDLE_FRAMES = 2;
const WALK_FRAMES = 4;
const FRAME_MS = 200;

const SPEED_PX_PER_SEC = 45;
const STORAGE_KEY = "duckyVisible";
const STORAGE_KEY_MUTED = "duckyMuted";

// Tight hitbox matching the duck's actual silhouette within the 48x48 sprite
// frame (the frame itself has lots of transparent padding around the duck).
const HITBOX_LEFT = 21;
const HITBOX_TOP = 31;
const HITBOX_WIDTH = 33;
const HITBOX_HEIGHT = 41;

const DRAG_SCALE = 1.12;
const DRAG_ROTATION_FACTOR = 16;
const DRAG_ROTATION_MAX = 34;
const DRAG_ROTATION_FRICTION = 0.95;
const DRAG_ROTATION_LERP = 0.14;

import { DUCKY_CONFIG } from "@/config/ducky";

type Direction = "left" | "right";
interface Vec2 { x: number; y: number }

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}


export function getDuckyVisible(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== "false"; } catch { return true; }
}

export function setDuckyVisible(v: boolean) {
  try { localStorage.setItem(STORAGE_KEY, String(v)); } catch { /* */ }
  window.dispatchEvent(new CustomEvent("ducky-toggle", { detail: v }));
}

export function getDuckyMuted(): boolean {
  try { return localStorage.getItem(STORAGE_KEY_MUTED) === "true"; } catch { return false; }
}

export function setDuckyMuted(v: boolean) {
  try { localStorage.setItem(STORAGE_KEY_MUTED, String(v)); } catch { /* */ }
  window.dispatchEvent(new CustomEvent("ducky-toggle", { detail: v }));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export default function DuckyPet() {
  const pathname = usePathname();
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const posRef = useRef<Vec2 | null>(null);
  const velRef = useRef<Vec2>({ x: 0, y: 0 });
  const dirRef = useRef<Direction>("right");
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const frameMsRef = useRef(0);
  const wanderTimerRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isHoveredRef = useRef(false);
  const visibleRef = useRef(true);
  const idleImgRef = useRef<HTMLImageElement | null>(null);
  const walkImgRef = useRef<HTMLImageElement | null>(null);
  const spritesReady = useRef(false);

  const duckRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activePhrase, setActivePhrase] = useState<string | null>(null);
  const activePhraseRef = useRef<string | null>(null);

  const isDraggingRef = useRef(false);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const dragStartClientRef = useRef<Vec2>({ x: 0, y: 0 });
  const dragStartPosRef = useRef<Vec2>({ x: 0, y: 0 });
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const dragRotationRef = useRef(0);
  const dragRotationTargetRef = useRef(0);
  const dragScaleRef = useRef(1);
  const mutedRef = useRef(false);
  const visible = useSyncExternalStore(subscribeDuckyToggle, getDuckyVisible, () => true);
  const muted = useSyncExternalStore(subscribeDuckyToggle, getDuckyMuted, () => false);

  // Do not render on docs pages
  const isDocs = pathname?.includes("/docs");

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const playQuack = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const audio = new Audio('/sounds/quack.mp3');
      audio.volume = DUCKY_CONFIG.volume;
      audio.playbackRate = 0.9 + Math.random() * 0.2;
      audio.play().catch(() => {});
    } catch { /* */ }
  }, []);

  function subscribeDuckyToggle(callback: () => void) {
    window.addEventListener("ducky-toggle", callback);
    return () => window.removeEventListener("ducky-toggle", callback);
  }

  const pickNewWander = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const sX = window.scrollX;
    const sY = window.scrollY;

    const px = posRef.current?.x ?? (sX + W / 2);
    const py = posRef.current?.y ?? (sY + H / 2);

    const vx = px - sX;
    const vy = py - sY;
    const m = 80;

    let aMin = 0, aMax = Math.PI * 2;

    // If completely outside viewport, aim towards the center of the viewport
    if (vx < 0 || vx > W || vy < 0 || vy > H) {
      const targetX = sX + W / 2;
      const targetY = sY + H / 2;
      const angle = Math.atan2(targetY - py, targetX - px);
      aMin = angle - 0.5;
      aMax = angle + 0.5;
    } else {
      // Inside viewport: push away from edges
      if (vx < m) { aMin = -Math.PI / 2; aMax = Math.PI / 2; }
      else if (vx > W - m) { aMin = Math.PI / 2; aMax = (3 * Math.PI) / 2; }
      if (vy < m) { aMin = 0; aMax = Math.PI; }
      else if (vy > H - m) { aMin = Math.PI; aMax = Math.PI * 2; }
    }

    const angle = rnd(aMin, aMax);
    const speed = rnd(SPEED_PX_PER_SEC * 0.6, SPEED_PX_PER_SEC * 1.5);
    velRef.current = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };

    const newDir = velRef.current.x >= 0 ? "right" : "left";
    dirRef.current = newDir;
    wanderTimerRef.current = rnd(1500, 4000);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragPointerIdRef.current = e.pointerId;
    dragMovedRef.current = false;
    dragStartClientRef.current = { x: e.clientX, y: e.clientY };
    dragStartPosRef.current = posRef.current ?? { x: window.scrollX, y: window.scrollY };
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* */ }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - dragStartClientRef.current.x;
    const dy = e.clientY - dragStartClientRef.current.y;

    if (!dragMovedRef.current) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      dragMovedRef.current = true;
      isDraggingRef.current = true;
      isHoveredRef.current = true;
      setIsDragging(true);
      setIsHovered(false);
      setActivePhrase(null);
      activePhraseRef.current = null;
      frameRef.current = 0;
      frameMsRef.current = 0;
    }

    const last = lastMoveRef.current;
    if (last) {
      const dt = Math.max(e.timeStamp - last.t, 1);
      const vx = (e.clientX - last.x) / dt;
      dragRotationTargetRef.current = Math.max(-DRAG_ROTATION_MAX, Math.min(DRAG_ROTATION_MAX, vx * DRAG_ROTATION_FACTOR));
    }
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };

    const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth) - DISPLAY_SIZE;
    const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight) - DISPLAY_SIZE;
    const nx = Math.min(Math.max(dragStartPosRef.current.x + dx, 0), Math.max(docW, 0));
    const ny = Math.min(Math.max(dragStartPosRef.current.y + dy, 0), Math.max(docH, 0));
    posRef.current = { x: nx, y: ny };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current !== e.pointerId) return;
    dragPointerIdRef.current = null;
    lastMoveRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* */ }
    if (dragMovedRef.current) {
      isDraggingRef.current = false;
      isHoveredRef.current = false;
      setIsDragging(false);
      pickNewWander();
    }
  }, [pickNewWander]);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spritesReady.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hovered = isHoveredRef.current || activePhraseRef.current !== null;
    const img = hovered ? idleImgRef.current : walkImgRef.current;
    if (!img) return;

    const f = frameRef.current;
    const pad = 10;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    const sx = f * SPRITE_SIZE;
    const dx = pad;
    const dy = pad;
    const sw = SPRITE_SIZE;
    const sh = SPRITE_SIZE;
    const dw = DISPLAY_SIZE;
    const dh = DISPLAY_SIZE;

    // Adaptive shadow based on theme
    const isDark = document.documentElement.classList.contains("dark");
    const glowColor = isDark ? "rgba(87, 46, 2, 0.88)" : "rgba(212, 160, 23, 0.25)";

    // While being dragged, push the shadow further down and fade it a bit
    // to sell the duck as lifted off the ground.
    const dragging = isDraggingRef.current;
    const shadowLift = dragging ? 9 : 2;
    const shadowAlphaMul = dragging ? 0.6 : 1;

    const passes = [
      { spread: 7, alpha: 0.08 },
      { spread: 5, alpha: 0.10 },
      { spread: 3, alpha: 0.14 },
      { spread: 1, alpha: 0.18 },
    ];
    ctx.save();
    for (const { spread: sp, alpha } of passes) {
      ctx.globalAlpha = alpha * shadowAlphaMul;
      for (let bx = -sp; bx <= sp; bx += Math.max(1, sp)) {
        for (let by = -sp; by <= sp; by += Math.max(1, sp)) {
          ctx.drawImage(img, sx, 0, sw, sh, dx + bx, dy + by + shadowLift, dw, dh);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = glowColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, 0, sw, sh, dx, dy, dw, dh);
    ctx.restore();
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTimeRef.current = 0;
    const loop = (now: number) => {
      if (!visibleRef.current) return;

      const dt = Math.min(now - (lastTimeRef.current || now), 100);
      lastTimeRef.current = now;

      if (!isHoveredRef.current && activePhraseRef.current === null) {
        wanderTimerRef.current -= dt;
        if (wanderTimerRef.current <= 0) pickNewWander();

        const cur = posRef.current ?? { x: window.scrollX + window.innerWidth / 2, y: window.scrollY + window.innerHeight / 2 };

        let nx = cur.x + velRef.current.x * (dt / 1000);
        let ny = cur.y + velRef.current.y * (dt / 1000);

        const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth) - DISPLAY_SIZE;
        const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight) - DISPLAY_SIZE;

        if (nx < 0) { nx = 0; velRef.current.x = Math.abs(velRef.current.x); dirRef.current = "right"; }
        if (nx > docW) { nx = docW; velRef.current.x = -Math.abs(velRef.current.x); dirRef.current = "left"; }
        if (ny < 0) { ny = 0; velRef.current.y = Math.abs(velRef.current.y); }
        if (ny > docH) { ny = docH; velRef.current.y = -Math.abs(velRef.current.y); }

        posRef.current = { x: nx, y: ny };

        frameMsRef.current += dt;
        if (frameMsRef.current >= FRAME_MS) {
          frameMsRef.current = 0;
          frameRef.current = (frameRef.current + 1) % WALK_FRAMES;
        }
      } else if (!isDraggingRef.current) {
        // Idle's own bob (frame swap) fights the drag swing, so freeze the
        // frame while held instead of cycling it.
        frameMsRef.current += dt;
        if (frameMsRef.current >= FRAME_MS * 1.5) {
          frameMsRef.current = 0;
          frameRef.current = (frameRef.current + 1) % IDLE_FRAMES;
        }
      }

      // Drag "held" physics: rotation swings with lag behind pointer velocity
      // (friction decay + lerp), and scale eases toward a lifted pop. Runs
      // unconditionally so the swing keeps settling after release too.
      dragRotationTargetRef.current *= DRAG_ROTATION_FRICTION;
      dragRotationRef.current += (dragRotationTargetRef.current - dragRotationRef.current) * DRAG_ROTATION_LERP;
      dragScaleRef.current += ((isDraggingRef.current ? DRAG_SCALE : 1) - dragScaleRef.current) * 0.2;

      // Update DOM directly for smooth scroll following
      if (duckRef.current && posRef.current) {
        const docX = posRef.current.x;
        const docY = posRef.current.y;
        const scale = dirRef.current === "left" ? -1 : 1;
        duckRef.current.style.transform = `translate(${docX - window.scrollX}px, ${docY - window.scrollY}px) scaleX(${scale}) rotate(${dragRotationRef.current.toFixed(2)}deg) scale(${dragScaleRef.current.toFixed(3)})`;
      }
      
      if (bubbleRef.current && posRef.current) {
        const docX = posRef.current.x + DISPLAY_SIZE / 2;
        const docY = posRef.current.y + 18;
        bubbleRef.current.style.transform = `translate(${docX - window.scrollX}px, ${docY - window.scrollY}px) translate(-50%, -100%)`;
      }

      drawFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame, pickNewWander]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (visible && !isDocs && spritesReady.current) {
      startLoop();
    } else {
      stopLoop();
    }
    return () => stopLoop();
  }, [visible, isDocs, startLoop, stopLoop]);

  // Periodic phrases
  useEffect(() => {
    if (!visible || isDocs || isHovered) return;
    const interval = setInterval(() => {
      if (Math.random() < DUCKY_CONFIG.quackChance) {
        const phrase = DUCKY_CONFIG.phrases[Math.floor(Math.random() * DUCKY_CONFIG.phrases.length)];
        setActivePhrase(phrase);
        activePhraseRef.current = phrase;
        playQuack();
        setTimeout(() => {
          setActivePhrase(null);
          activePhraseRef.current = null;
        }, DUCKY_CONFIG.bubbleDurationMs);
      }
    }, DUCKY_CONFIG.quackIntervalMs);
    return () => clearInterval(interval);
  }, [visible, isDocs, isHovered, playQuack]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      loadImage("/sprites/ducky-idle.png"),
      loadImage("/sprites/ducky-walk.png"),
    ])
      .then(([idle, walk]) => {
        if (!isMounted) return;
        idleImgRef.current = idle;
        walkImgRef.current = walk;
        spritesReady.current = true;

        const W = window.innerWidth;
        const H = window.innerHeight;
        // spawn inside initial visible viewport
        const spawn = {
           x: window.scrollX + (Math.random() > 0.5 ? -DISPLAY_SIZE : W),
           y: window.scrollY + rnd(80, Math.max(81, H - 80 - DISPLAY_SIZE))
        };
        posRef.current = spawn;
        pickNewWander();

        setMounted(true); // trigger initial render

        if (visibleRef.current && !isDocs) {
          startLoop();
        }
      })
      .catch((err) => {
        console.warn("[DuckyPet] Failed to load duck sprite images:", err);
      });

    return () => {
      isMounted = false;
      stopLoop();
    };
  }, [pickNewWander, startLoop, stopLoop, isDocs]);

  // Seeds the bubble's transform synchronously before paint so it doesn't
  // flicker at (0,0) for a frame — the RAF loop (see startLoop) takes over
  // on every subsequent frame once it's running.
  useLayoutEffect(() => {
    if ((isHovered || activePhrase !== null) && bubbleRef.current && posRef.current) {
      const docX = posRef.current.x + DISPLAY_SIZE / 2;
      const docY = posRef.current.y + 18;
      bubbleRef.current.style.transform = `translate(${docX - window.scrollX}px, ${docY - window.scrollY}px) translate(-50%, -100%)`;
    }
  }, [isHovered, activePhrase]);

  if (!mounted || isDocs) return null;

  const PAD = 10;
  const CV = DISPLAY_SIZE + PAD * 2;

  const showBubble = isHovered || activePhrase !== null;

  return (
    <div ref={sectionRef} style={{ position: "fixed", top: 0, left: 0, width: 0, height: 0, pointerEvents: "none", zIndex: 0 }}>
      <div
        ref={duckRef}
        style={{
          position: "absolute" as const,
          left: 0,
          top: 0,
          width: DISPLAY_SIZE,
          height: DISPLAY_SIZE,
          opacity: visible ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          transformOrigin: "50% 35%",
          // transform is managed by requestAnimationFrame
        }}
      >
        <canvas
          ref={canvasRef}
          width={CV}
          height={CV}
          style={{
            position: "absolute" as const,
            left: -PAD,
            top: -PAD,
            imageRendering: "pixelated",
            pointerEvents: "none",
          }}
        />

        {/* Tight hitbox matching the duck's silhouette, not the padded sprite frame */}
        <div
          style={{
            position: "absolute" as const,
            left: HITBOX_LEFT,
            top: HITBOX_TOP,
            width: HITBOX_WIDTH,
            height: HITBOX_HEIGHT,
            pointerEvents: visible ? "auto" : "none",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
            userSelect: "none",
          }}
          onMouseEnter={() => {
            if (isDragging) return;
            isHoveredRef.current = true;
            setIsHovered(true);
            setActivePhrase(null);
            activePhraseRef.current = null;
            frameRef.current = 0;
            frameMsRef.current = 0;
            playQuack();
          }}
          onMouseLeave={() => { if (isDragging) return; isHoveredRef.current = false; setIsHovered(false); frameRef.current = 0; frameMsRef.current = 0; }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => {
            if (dragMovedRef.current) {
              dragMovedRef.current = false;
              return;
            }
            window.open("https://" + DUCKY_EASTER_EGG_HOST, "_blank", "noopener,noreferrer");
          }}
        />
      </div>

      {showBubble && visible && (
        <div
          ref={bubbleRef}
          style={{
            position: "absolute" as const,
            left: 0,
            top: 0,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 50,
            // Actual initial position is set synchronously by the layout effect above before paint.
            transform: "none",
          }}
        >
          {/* bubble body */}
          <div style={{
            background: "rgba(255,255,255,0.95)",
            color: "#1a160a",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: "1.4",
            padding: "6px 12px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            border: "1.5px solid rgba(212,160,23,0.5)",
          }}>
            {isHovered ? (
              <>
                <p>Я ищу Золотой Идол!</p>
                <p>Можешь помочь мне в поисках?</p>
              </>
            ) : (
              <p>{activePhrase}</p>
            )}
          </div>
          {/* tail pointing down toward duck */}
          <div style={{
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid rgba(255,255,255,0.95)",
            margin: "-1px auto 0",
          }} />
        </div>
      )}
    </div>
  );
}

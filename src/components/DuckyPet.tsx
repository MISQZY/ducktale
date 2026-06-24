"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const SPRITE_SIZE = 48;
const DISPLAY_SCALE = 1.5;
const DISPLAY_SIZE = SPRITE_SIZE * DISPLAY_SCALE;

const IDLE_FRAMES = 2;
const WALK_FRAMES = 4;
const FRAME_MS = 200;

const SPEED_PX_PER_SEC = 45;
const TARGET_URL = "duckeldor.ducktale.online";
const STORAGE_KEY = "duckyVisible";

type Direction = "left" | "right";
interface Vec2 { x: number; y: number }

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomSpawn(W: number, H: number): Vec2 {
  const pad = 80;
  return {
    x: rnd(pad, Math.max(pad + 1, W - pad - DISPLAY_SIZE)),
    y: rnd(pad, Math.max(pad + 1, H - pad - DISPLAY_SIZE)),
  };
}

export function getDuckyVisible(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== "false"; } catch { return true; }
}

export function setDuckyVisible(v: boolean) {
  try { localStorage.setItem(STORAGE_KEY, String(v)); } catch { /* */ }
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

  const [pos, setPos] = useState<Vec2 | null>(null);
  const [dir, setDir] = useState<Direction>("right");
  const [isHovered, setIsHovered] = useState(false);
  const [layer, setLayer] = useState<1 | 2>(1);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const v = getDuckyVisible();
    visibleRef.current = v;
    setVisible(v);
    const h = (e: Event) => {
      const val = (e as CustomEvent<boolean>).detail;
      visibleRef.current = val;
      setVisible(val);
    };
    window.addEventListener("ducky-toggle", h);
    return () => window.removeEventListener("ducky-toggle", h);
  }, []);

  const pickNewWander = useCallback(() => {
    const el = sectionRef.current;
    const W = el?.offsetWidth ?? window.innerWidth;
    const H = el?.offsetHeight ?? window.innerHeight;
    const px = posRef.current?.x ?? W / 2;
    const py = posRef.current?.y ?? H / 2;

    const m = 80;
    let aMin = 0, aMax = Math.PI * 2;
    if (px < m) { aMin = -Math.PI / 2; aMax = Math.PI / 2; }
    else if (px > W - m) { aMin = Math.PI / 2; aMax = (3 * Math.PI) / 2; }
    if (py < m) { aMin = 0; aMax = Math.PI; }
    else if (py > H - m) { aMin = Math.PI; aMax = Math.PI * 2; }

    const angle = rnd(aMin, aMax);
    const speed = rnd(SPEED_PX_PER_SEC * 0.6, SPEED_PX_PER_SEC * 1.2);
    velRef.current = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
    dirRef.current = velRef.current.x >= 0 ? "right" : "left";
    setDir(dirRef.current);
    wanderTimerRef.current = rnd(1500, 4000);
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spritesReady.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hovered = isHoveredRef.current;
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

    const glowColor = "rgba(87, 46, 2, 0.88)";
    const passes = [
      { spread: 7, alpha: 0.08 },
      { spread: 5, alpha: 0.10 },
      { spread: 3, alpha: 0.14 },
      { spread: 1, alpha: 0.18 },
    ];
    ctx.save();
    for (const { spread: sp, alpha } of passes) {
      ctx.globalAlpha = alpha;
      for (let bx = -sp; bx <= sp; bx += Math.max(1, sp)) {
        for (let by = -sp; by <= sp; by += Math.max(1, sp)) {
          ctx.drawImage(img, sx, 0, sw, sh, dx + bx, dy + by + 2, dw, dh);
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

  const tickRef = useRef<(now: number) => void>(() => { });
  tickRef.current = (now: number) => {
    if (!visibleRef.current) return;

    const dt = Math.min(now - (lastTimeRef.current || now), 100);
    lastTimeRef.current = now;

    if (!isHoveredRef.current) {
      wanderTimerRef.current -= dt;
      if (wanderTimerRef.current <= 0) pickNewWander();

      const el = sectionRef.current;
      const W = (el?.offsetWidth ?? window.innerWidth) - DISPLAY_SIZE;
      const H = (el?.offsetHeight ?? window.innerHeight) - DISPLAY_SIZE;
      const cur = posRef.current ?? { x: 0, y: 0 };

      let nx = cur.x + velRef.current.x * (dt / 1000);
      let ny = cur.y + velRef.current.y * (dt / 1000);

      if (nx < 0) { nx = 0; velRef.current.x = Math.abs(velRef.current.x); dirRef.current = "right"; setDir("right"); }
      if (nx > W) { nx = W; velRef.current.x = -Math.abs(velRef.current.x); dirRef.current = "left"; setDir("left"); }
      if (ny < 0) { ny = 0; velRef.current.y = Math.abs(velRef.current.y); }
      if (ny > H) { ny = H; velRef.current.y = -Math.abs(velRef.current.y); }

      posRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });

      const sH = el?.offsetHeight ?? window.innerHeight;
      setLayer(ny > sH * 0.6 ? 2 : 1);

      frameMsRef.current += dt;
      if (frameMsRef.current >= FRAME_MS) {
        frameMsRef.current = 0;
        frameRef.current = (frameRef.current + 1) % WALK_FRAMES;
      }
    } else {
      frameMsRef.current += dt;
      if (frameMsRef.current >= FRAME_MS * 1.5) {
        frameMsRef.current = 0;
        frameRef.current = (frameRef.current + 1) % IDLE_FRAMES;
      }
    }

    drawFrame();
    rafRef.current = requestAnimationFrame((t) => tickRef.current(t));
  };

  useEffect(() => {
    if (visible && spritesReady.current) {
      lastTimeRef.current = 0;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame((t) => tickRef.current(t));
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    Promise.all([
      loadImage("/sprites/ducky-idle.png"),
      loadImage("/sprites/ducky-walk.png"),
    ]).then(([idle, walk]) => {
      idleImgRef.current = idle;
      walkImgRef.current = walk;
      spritesReady.current = true;

      const el = sectionRef.current;
      const W = el?.offsetWidth ?? window.innerWidth;
      const H = el?.offsetHeight ?? window.innerHeight;
      const spawn = randomSpawn(W, H);
      posRef.current = spawn;
      setPos(spawn);
      pickNewWander();

      if (visibleRef.current) {
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame((t) => tickRef.current(t));
      }
    });
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pos) return null;

  const PAD = 10;
  const CV = DISPLAY_SIZE + PAD * 2;

  const bubbleBottom = pos.y + 18;

  return (
    <div ref={sectionRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: layer }}>

      <div
        style={{
          position: "absolute" as const,
          left: pos.x,
          top: pos.y,
          width: DISPLAY_SIZE,
          height: DISPLAY_SIZE,
          transform: dir === "left" ? "scaleX(-1)" : "scaleX(1)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
        onMouseEnter={() => { isHoveredRef.current = true; setIsHovered(true); frameRef.current = 0; frameMsRef.current = 0; }}
        onMouseLeave={() => { isHoveredRef.current = false; setIsHovered(false); frameRef.current = 0; frameMsRef.current = 0; }}
        onClick={() => window.open("https://" + TARGET_URL, "_blank", "noopener,noreferrer")}
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
      </div>

      {isHovered && visible && (
        <div
          style={{
            position: "absolute" as const,
            left: pos.x + DISPLAY_SIZE / 2,
            top: bubbleBottom,
            transform: "translate(-50%, -100%)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 50,
          }}
        >
          {/* bubble body */}
          <div style={{
            background: "rgba(255,255,255,0.95)",
            color: "#1a160a",
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 600,
            lineHeight: "1.3",
            padding: "5px 10px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            border: "1.5px solid rgba(212,160,23,0.5)",
          }}>
            <p>Я ищу Золотой Идол!</p>
            <p>Можешь помочь мне в поисках?</p>

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

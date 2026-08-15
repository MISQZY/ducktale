"use client";

import { useEffect, useRef, useState } from "react";
import { getDuckyVisible } from "./DuckyPet";

const DISPLAY_SIZE = 72;
const SPEED = 150;

interface SwarmDuck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  frame: number;
  timer: number;
}

export default function DuckySwarm() {
  const [active, setActive] = useState(false);
  const [duckCount, setDuckCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const ducksRef = useRef<SwarmDuck[]>([]);
  const divRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);
  const frameMsRef = useRef(0);
  const runAwayRef = useRef(false);
  const audioPoolRef = useRef<HTMLAudioElement[]>([]);

  // Reacts to the toggle event directly (a real external-system callback)
  // instead of syncing a `visible` state value through an effect, which
  // would call setState synchronously in the effect body.
  useEffect(() => {
    const onToggle = () => {
      if (!getDuckyVisible()) setActive(false);
    };
    window.addEventListener("ducky-toggle", onToggle);
    return () => window.removeEventListener("ducky-toggle", onToggle);
  }, []);

  useEffect(() => {
    // Initialize audio pool on first interaction to avoid creating 
    // hundreds of Audio objects during the animation loop
    const initAudioPool = () => {
      if (audioPoolRef.current.length === 0) {
        audioPoolRef.current = Array.from({ length: 5 }, () => {
          const a = new Audio('/sounds/quack.mp3');
          a.preload = "auto";
          return a;
        });
      }
    };

    const onSwarm = () => {
      if (!getDuckyVisible()) return;
      if (active) return;
      
      initAudioPool();
      
      const W = window.innerWidth;
      const H = window.innerHeight;
      const sX = window.scrollX;
      const sY = window.scrollY;
      
      // Reduce duck count heavily on mobile devices for performance — mobile
      // GPUs handle this animation much worse than desktop (see the
      // drop-shadow note below), so it needs a bigger cut than just "fewer
      // ducks" alone would give.
      const mobile = W < 768;
      const count = mobile ? 8 : 50;
      setIsMobile(mobile);
      setDuckCount(count);
      
      const newDucks: SwarmDuck[] = [];
      for (let i = 0; i < count; i++) {
        const isLeft = Math.random() > 0.5;
        newDucks.push({
          x: sX + (isLeft ? -DISPLAY_SIZE : W + DISPLAY_SIZE),
          y: sY + Math.random() * H,
          vx: (isLeft ? 1 : -1) * SPEED * (0.8 + Math.random() * 0.6),
          vy: (Math.random() - 0.5) * SPEED,
          frame: Math.floor(Math.random() * 4),
          timer: Math.random() * 2000,
        });
      }
      ducksRef.current = newDucks;
      runAwayRef.current = false;
      setActive(true);
      
      try {
        const initialAudio = audioPoolRef.current[0];
        if (initialAudio) {
          initialAudio.volume = 0.5;
          initialAudio.currentTime = 0;
          initialAudio.play().catch(() => {});
        }
      } catch {}
      
      setTimeout(() => {
        runAwayRef.current = true;
      }, 30000);
    };
    
    window.addEventListener("ducky-swarm", onSwarm);
    return () => window.removeEventListener("ducky-swarm", onSwarm);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let lastTime = 0;
    
    const loop = (now: number) => {
      const dt = Math.min(now - (lastTime || now), 100);
      lastTime = now;
      
      frameMsRef.current += dt;
      const tickFrame = frameMsRef.current >= 120;
      if (tickFrame) frameMsRef.current = 0;

      const W = window.innerWidth;
      const H = window.innerHeight;
      const sX = window.scrollX;
      const sY = window.scrollY;
      
      let allGone = true;

      for (let i = 0; i < ducksRef.current.length; i++) {
        const duck = ducksRef.current[i];
        
        if (runAwayRef.current) {
           if (Math.abs(duck.vx) < SPEED * 2) {
             const angle = Math.atan2(duck.vy, duck.vx);
             duck.vx = Math.cos(angle) * SPEED * 2.5;
             duck.vy = Math.sin(angle) * SPEED * 2.5;
           }
        } else {
           duck.timer -= dt;
           if (duck.timer <= 0) {
             const angle = Math.random() * Math.PI * 2;
             duck.vx = Math.cos(angle) * SPEED * (0.8 + Math.random() * 0.6);
             duck.vy = Math.sin(angle) * SPEED * (0.8 + Math.random() * 0.6);
             duck.timer = 1000 + Math.random() * 2000;
           }
           
           const vx = duck.x - sX;
           const vy = duck.y - sY;
           if (vx < 0 && duck.vx < 0) duck.vx *= -1;
           if (vx > W - DISPLAY_SIZE && duck.vx > 0) duck.vx *= -1;
           if (vy < 0 && duck.vy < 0) duck.vy *= -1;
           if (vy > H - DISPLAY_SIZE && duck.vy > 0) duck.vy *= -1;
        }

        duck.x += duck.vx * (dt / 1000);
        duck.y += duck.vy * (dt / 1000);
        if (tickFrame) duck.frame = (duck.frame + 1) % 4;

        if (!runAwayRef.current || (duck.x > sX - DISPLAY_SIZE * 2 && duck.x < sX + W + DISPLAY_SIZE * 2 && duck.y > sY - DISPLAY_SIZE * 2 && duck.y < sY + H + DISPLAY_SIZE * 2)) {
          allGone = false;
        }

        const div = divRefs.current[i];
        if (div) {
          const docX = duck.x;
          const docY = duck.y;
          const scale = duck.vx >= 0 ? 1 : -1;
          // Use translate3d to force hardware acceleration
          div.style.transform = `translate3d(${docX - sX}px, ${docY - sY}px, 0) scaleX(${scale})`;
          div.style.backgroundPosition = `-${duck.frame * DISPLAY_SIZE}px 0`;
        }
      }

      // Random quacking using the pre-initialized audio pool (much better for GC)
      if (Math.random() < 0.04 && audioPoolRef.current.length > 0) {
        try {
          const audio = audioPoolRef.current[Math.floor(Math.random() * audioPoolRef.current.length)];
          audio.volume = 0.15 + Math.random() * 0.15;
          audio.playbackRate = 0.9 + Math.random() * 0.4;
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } catch {}
      }

      if (runAwayRef.current && allGone) {
        setActive(false);
      } else {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: 0, height: 0, pointerEvents: "none", zIndex: 0 }}>
      {Array.from({ length: duckCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { divRefs.current[i] = el; }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: DISPLAY_SIZE,
            height: DISPLAY_SIZE,
            backgroundImage: "url(/sprites/ducky-walk.png)",
            backgroundSize: "400% 100%",
            imageRendering: "pixelated",
            // drop-shadow is by far the most expensive part of this per
            // animated element — it forces the browser to re-rasterize a
            // blurred layer every frame, which desktop GPUs shrug off but
            // mobile ones visibly can't keep up with across several ducks
            // at once. Skipped on mobile rather than tuned down, since even
            // a smaller blur still repaints every frame.
            ...(isMobile ? {} : { filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }),
            willChange: "transform, background-position",
          }}
        />
      ))}
    </div>
  );
}

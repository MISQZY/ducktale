"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  const ducksRef = useRef<SwarmDuck[]>([]);
  const divRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);
  const frameMsRef = useRef(0);
  const runAwayRef = useRef(false);

  function subscribeDuckyToggle(callback: () => void) {
    window.addEventListener("ducky-toggle", callback);
    return () => window.removeEventListener("ducky-toggle", callback);
  }
  const visible = useSyncExternalStore(subscribeDuckyToggle, getDuckyVisible, () => true);

  useEffect(() => {
    if (!visible) {
      setActive(false);
    }
  }, [visible]);

  useEffect(() => {
    const onSwarm = () => {
      if (!getDuckyVisible()) return;
      if (active) return;
      
      const W = window.innerWidth;
      const H = window.innerHeight;
      const sX = window.scrollX;
      const sY = window.scrollY;
      
      const newDucks: SwarmDuck[] = [];
      for (let i = 0; i < 50; i++) {
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
        const audio = new Audio('/sounds/quack.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch(e) {}
      
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
          const screenX = duck.x - sX;
          const screenY = duck.y - sY;
          const scale = duck.vx >= 0 ? 1 : -1;
          div.style.transform = `translate(${screenX}px, ${screenY}px) scaleX(${scale})`;
          div.style.backgroundPosition = `-${duck.frame * DISPLAY_SIZE}px 0`;
        }
      }

      // Random quacking during the swarm (about 2-3 quacks per second)
      if (Math.random() < 0.04) {
        try {
          const audio = new Audio('/sounds/quack.mp3');
          audio.volume = 0.15 + Math.random() * 0.15; // random volume 0.15 - 0.30
          // Randomize pitch slightly by changing playbackRate
          audio.playbackRate = 0.9 + Math.random() * 0.4;
          audio.play().catch(() => {});
        } catch(e) {}
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
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {Array.from({ length: 50 }).map((_, i) => (
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
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
          }}
        />
      ))}
    </div>
  );
}

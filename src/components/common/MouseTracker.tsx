"use client";

import { useEffect } from "react";

export function MouseTracker() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Find the closest badge that we are hovering over
      const target = e.target as HTMLElement;
      if (!target || !target.closest) return;
      
      let current: HTMLElement | null = target;
      while (current) {
        const match = current.closest(".liquid-badge, [data-roles-badge], .liquid-card, [data-card], .fd-card") as HTMLElement;
        if (!match) break;
        
        const rect = match.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        match.style.setProperty("--mouse-x", `${x}px`);
        match.style.setProperty("--mouse-y", `${y}px`);
        
        current = match.parentElement;
      }
    };

    // Use capturing phase so we catch it before any stopPropagation
    window.addEventListener("mousemove", handleMouseMove, true);
    return () => window.removeEventListener("mousemove", handleMouseMove, true);
  }, []);

  return null;
}

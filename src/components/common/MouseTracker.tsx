"use client";

import { useEffect } from "react";

export function MouseTracker() {
  useEffect(() => {
    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const target = e.target as HTMLElement;
          if (target && target.closest) {
            let current = target.closest(".liquid-badge, [data-roles-badge], .liquid-card, [data-card], .fd-card, .liquid-cta") as HTMLElement | null;
            while (current) {
              const rect = current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              current.style.setProperty("--mouse-x", `${x}px`);
              current.style.setProperty("--mouse-y", `${y}px`);
              
              const parent = current.parentElement;
              current = parent ? parent.closest(".liquid-badge, [data-roles-badge], .liquid-card, [data-card], .fd-card, .liquid-cta") as HTMLElement | null : null;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use capturing phase so we catch it before any stopPropagation
    window.addEventListener("mousemove", handleMouseMove, { capture: true, passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove, { capture: true } as EventListenerOptions);
  }, []);

  return null;
}

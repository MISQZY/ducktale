"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function ScrollReveal({ 
  children, 
  className 
}: { 
  children: ReactNode, 
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        // pointer-events-none: this wrapper (and every section's own inner
        // z-10 content column) is mostly whitespace around cards/links, and
        // its box was capturing clicks meant for whatever sits behind the
        // page (the DuckyPet overlay) even over empty space. Actual
        // interactive/visible elements (cards, buttons, links) re-enable
        // pointer-events-auto individually.
        "relative z-10 pointer-events-none transition-[transform,opacity] duration-1000 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12",
        className
      )}
    >
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { SkinViewer, IdleAnimation } from "skinview3d";

interface SkinViewer3DProps {
  skinUrl: string;
}

// Used only until the ResizeObserver below reports the wrapper's real
// layout size — it can still measure 0×0 at construction time here, since
// this mounts inside EmbedPage's <dialog> (SkinViewButton) which is
// display:none by the UA stylesheet until showModal() runs, and that's a
// parent effect that fires after this component's own effect.
const FALLBACK_SIZE = { width: 320, height: 420 };

/**
 * Full-body 3D player model via skinview3d (bundles three.js) — dynamically
 * imported by SkinViewButton so this ~600KB dependency is only fetched once
 * the viewer modal actually opens, not on every page a player card renders
 * on. Renders the same skinUrl SkinFace crops the flat head from.
 *
 * The ResizeObserver below watches the wrapper div, not the canvas itself —
 * SkinViewer's width/height setters put an explicit pixel style.width/
 * style.height on the canvas as part of resizing the renderer, so observing
 * the canvas would just watch a size we ourselves dictate: a self-
 * referential loop that never reports the actual available space (this is
 * exactly why the canvas rendered pinned to FALLBACK_SIZE in a corner
 * instead of filling the fullscreen viewer). The wrapper is absolutely
 * positioned against EmbedPage's content div (already `relative`) instead
 * of a flex/percentage-height chain, matching ImageViewer.tsx's pattern —
 * more robust than depending on height:100% resolving through a `flex-1`
 * ancestor.
 */
export default function SkinViewer3D({ skinUrl }: SkinViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const viewer = new SkinViewer({
      canvas,
      width: FALLBACK_SIZE.width,
      height: FALLBACK_SIZE.height,
      skin: skinUrl,
      animation: new IdleAnimation(),
    });

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        viewer.width = width;
        viewer.height = height;
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      viewer.dispose();
    };
  }, [skinUrl]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface PageEmbedProps {
  src: string;
  title?: string;
  height?: number;
}

export function PageEmbed({ src, title = "Embedded page", height = 500 }: PageEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(() => setIsFullscreen((v) => !v), []);

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full h-full max-h-full rounded-xl overflow-hidden border border-amber-900/30 shadow-2xl shadow-black/60 flex flex-col bg-[#0a0a0a]">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/20 bg-[#111]/80">
              <span className="text-xs text-amber-400 font-mono truncate">{title}</span>
              <button
                onClick={toggle}
                aria-label="Свернуть"
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-amber-400 hover:bg-amber-400/10 transition-colors"
              >
                <Minimize2 size={13} />
                <span>Свернуть</span>
              </button>
            </div>
            <iframe
              src={src}
              title={title}
              className="flex-1 w-full border-none"
              loading="lazy"
              allow="fullscreen"
            />
          </div>
        </div>
      )}

      {/* Inline embed */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-amber-900/25 bg-[#0a0a0a] my-4"
        style={{ height }}
      >
        {/* Gradient top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent z-10" />

        <iframe
          src={src}
          title={title}
          className="w-full h-full border-none"
          loading="lazy"
          allow="fullscreen"
        />

        {/* Fullscreen button — bottom left */}
        <button
          onClick={toggle}
          aria-label="Открыть на весь экран"
          className="
            absolute bottom-3 left-3 z-10
            flex items-center gap-1.5
            rounded-lg px-3 py-1.5
            text-xs font-medium text-amber-300
            bg-black/70 border border-amber-900/40
            hover:bg-amber-950/80 hover:border-amber-700/50
            backdrop-blur-sm
            transition-all duration-150
            shadow-lg shadow-black/40
          "
        >
          <Maximize2 size={13} />
          <span>Развернуть</span>
        </button>
      </div>
    </>
  );
}

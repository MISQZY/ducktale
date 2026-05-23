"use client";

import { useState, useCallback } from "react";
import { Maximize2, X } from "lucide-react";
import { DuckButton } from "@/components/ui/duck/button";
import { useFullscreen } from "@/hooks/useFullscreen";

interface PageEmbedProps {
  src: string;
  title?: string;
  height?: number;
}

export function PageEmbed({ src, title = "Embedded page", height = 500 }: PageEmbedProps) {
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => setOpen(false), []);
  const { closeButtonRef } = useFullscreen({ open, onClose: handleClose });

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/20 bg-[#111]/80 shrink-0 min-h-10">
            <span className="text-xs text-amber-400 font-mono truncate pr-4">{title}</span>
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              aria-label="Закрыть полноэкранный просмотр"
              className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md text-amber-500/60 hover:text-amber-300 hover:bg-amber-900/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <X size={16} />
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
      )}

      <div
        className="relative w-full rounded-xl overflow-hidden border border-amber-900/25 bg-[#0a0a0a] my-4 not-prose"
        style={{ height }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent z-10"
          aria-hidden="true"
        />
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-none"
          loading="lazy"
          allow="fullscreen"
        />
        <DuckButton
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label={`Открыть «${title}» на весь экран`}
          className="absolute bottom-3 left-3 z-10 h-auto gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-black/70 border-amber-900/40 hover:bg-amber-950/80 hover:border-amber-700/50 hover:text-amber-200 backdrop-blur-sm shadow-lg shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors"
        >
          <Maximize2 size={13} aria-hidden="true" />
          Развернуть
        </DuckButton>
      </div>
    </>
  );
}

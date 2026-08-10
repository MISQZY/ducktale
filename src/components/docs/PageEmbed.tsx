"use client";

import { useState, useCallback } from "react";
import { Maximize2 } from "lucide-react";
import { DuckButton } from "@/components/ui/duck/button";
import { useFullscreen } from "@/hooks/useFullscreen";
import { FullscreenViewerHeader, FULLSCREEN_OVERLAY_CLASS } from "@/components/common";

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
          className={FULLSCREEN_OVERLAY_CLASS}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <FullscreenViewerHeader ref={closeButtonRef} title={title} onClose={handleClose} />
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
          className="absolute bottom-3 left-3 z-10 h-auto gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-100 bg-black/70 border-primary/30 hover:bg-primary/80 hover:border-primary/55 hover:text-neutral-950 backdrop-blur-sm shadow-lg shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
        >
          <Maximize2 size={13} aria-hidden="true" />
          Развернуть
        </DuckButton>
      </div>
    </>
  );
}

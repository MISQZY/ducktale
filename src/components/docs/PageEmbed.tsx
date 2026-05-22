"use client";

import { useState, useCallback } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PageEmbedProps {
  src: string;
  title?: string;
  height?: number;
}

export function PageEmbed({ src, title = "Embedded page", height = 500 }: PageEmbedProps) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <>
      {/* Fullscreen Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 bg-[#0a0a0a] border-amber-900/30 gap-0">
          <DialogHeader className="px-4 py-2 border-b border-amber-900/20 bg-[#111]/80 shrink-0">
            <DialogTitle className="text-xs text-amber-400 font-mono font-normal truncate text-left">
              {title}
            </DialogTitle>
          </DialogHeader>
          <iframe
            src={src}
            title={title}
            className="flex-1 w-full border-none"
            loading="lazy"
            allow="fullscreen"
          />
        </DialogContent>
      </Dialog>

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

        {/* Fullscreen button */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggle}
          aria-label="Открыть на весь экран"
          className="
            absolute bottom-3 left-3 z-10 h-auto
            gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            text-amber-300 bg-black/70 border-amber-900/40
            hover:bg-amber-950/80 hover:border-amber-700/50
            backdrop-blur-sm shadow-lg shadow-black/40
          "
        >
          <Maximize2 size={13} />
          Развернуть
        </Button>
      </div>
    </>
  );
}
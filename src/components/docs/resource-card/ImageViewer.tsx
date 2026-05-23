"use client";

import { memo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFullscreen } from "@/hooks/useFullscreen";
import type { ResourceImage } from "./types";

interface ImageViewerProps {
  images: ResourceImage[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImageViewer = memo(
  ({ images, initialIndex, open, onOpenChange }: ImageViewerProps) => {
    const [index, setIndex] = useState(initialIndex);
    const hasMultiple = images.length > 1;

    const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

    const navigate = useCallback(
      (dir: "prev" | "next") =>
        setIndex((prev) =>
          dir === "prev"
            ? (prev - 1 + images.length) % images.length
            : (prev + 1) % images.length
        ),
      [images.length]
    );

    const { closeButtonRef } = useFullscreen({
      open,
      onClose: handleClose,
      withArrows: hasMultiple
        ? { onPrev: () => navigate("prev"), onNext: () => navigate("next") }
        : undefined,
    });

    useEffect(() => { if (open) setIndex(initialIndex); }, [open, initialIndex]);

    const current = images[index];
    if (!open || !current) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]"
        role="dialog"
        aria-modal="true"
        aria-label={current.alt ?? current.title ?? "Просмотр изображения"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/20 bg-[#111]/80 shrink-0 min-h-10">
          <span className="text-xs text-amber-400 font-mono truncate pr-4">
            {current.title ?? current.alt ?? "Просмотр изображения"}
          </span>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            aria-label="Закрыть полноэкранный просмотр"
            className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md text-amber-500/60 hover:text-amber-300 hover:bg-amber-900/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Image area */}
        <div className="relative flex-1 w-full overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-6">
            <div className="relative w-full h-full max-w-full md:max-w-[75vw] max-h-[90vh]">
              <Image
                src={current.src}
                alt={current.alt}
                title={current.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 95vw, 1200px"
                className="object-contain"
                quality={100}
                priority
              />
            </div>
          </div>

          {hasMultiple && (
            <>
              <button
                onClick={() => navigate("prev")}
                className={cn(
                  "absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-10",
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-black/60 border border-amber-900/30 text-amber-300/70",
                  "hover:bg-black/80 hover:text-amber-200 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                )}
                aria-label="Предыдущее изображение"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                onClick={() => navigate("next")}
                className={cn(
                  "absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-10",
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "bg-black/60 border border-amber-900/30 text-amber-300/70",
                  "hover:bg-black/80 hover:text-amber-200 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                )}
                aria-label="Следующее изображение"
              >
                <ChevronRight size={22} />
              </button>

              {/* Counter */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="px-3 py-1.5 rounded-full bg-black/60 border border-amber-900/30 text-amber-300/70 text-xs backdrop-blur-sm">
                  {index + 1} / {images.length}
                </span>
              </div>

              {/* Dot indicators */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      i === index ? "w-5 bg-amber-400" : "w-1.5 bg-white/30 hover:bg-white/50"
                    )}
                    aria-label={`Перейти к изображению ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

ImageViewer.displayName = "ImageViewer";

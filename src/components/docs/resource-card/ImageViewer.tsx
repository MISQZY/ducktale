"use client";

import { memo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFullscreen } from "@/hooks/useFullscreen";
import { EmbedPage } from "@/components/docs/EmbedPage";
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

    useFullscreen({
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
      <EmbedPage
        title={current.title ?? current.alt ?? "Просмотр изображения"}
        open={open}
        onOpenChange={onOpenChange}
        modalMode
      >
        <div className="relative flex-1 w-full overflow-hidden z-0 flex flex-col isolate">
          {/* Blurred Background */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-[-10%] blur-xl opacity-50 dark:opacity-60 transform-gpu">
              <Image
                src={current.src.replace(/(&|\?)sz=w\d+/, '$1sz=w3840')}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority
                unoptimized={true}
              />
            </div>
          </div>

          <div className="relative w-full flex-1 flex items-center justify-center z-10 transform-gpu">
            <div className="relative w-full h-full">
              <Image
                src={current.src.replace(/(&|\?)sz=w\d+/, '$1sz=w3840')}
                alt={current.alt}
                title={current.title}
                fill
                sizes="100vw"
                className="object-contain"
                quality={100}
                priority
                unoptimized={true}
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
                  "bg-black/50 border border-white/20 text-white/90 backdrop-blur-sm",
                  "shadow-[0_0_16px_rgba(212,160,23,0.15)]",
                  "hover:bg-black/75 hover:text-white hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
                  "bg-black/50 border border-white/20 text-white/90 backdrop-blur-sm",
                  "shadow-[0_0_16px_rgba(212,160,23,0.15)]",
                  "hover:bg-black/75 hover:text-white hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
                aria-label="Следующее изображение"
              >
                <ChevronRight size={22} />
              </button>

              {/* Counter */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <span
                  className="px-3 py-1.5 rounded-full bg-black/50 border border-white/20 text-white/90 text-xs backdrop-blur-sm tabular-nums"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
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
                      i === index
                        ? "w-5 bg-primary shadow-[0_0_8px_rgba(212,160,23,0.6)]"
                        : "w-1.5 bg-white/30 hover:bg-white/50"
                    )}
                    aria-label={`Перейти к изображению ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </EmbedPage>
    );
  }
);

ImageViewer.displayName = "ImageViewer";

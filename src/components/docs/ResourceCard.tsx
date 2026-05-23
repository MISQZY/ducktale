"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { Package, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DuckBadge } from "@/components/ui/duck/badge";
import { DuckButton } from "@/components/ui/duck/button";
import {
  DuckCard,
  DuckCardContent,
  DuckCardDescription,
  DuckCardHeader,
  DuckCardTitle,
} from "@/components/ui/duck/card";

import { DependencyBadge } from "./resource-card/DependencyBadge";
import { CarouselIndicators } from "./resource-card/CarouselIndicators";
import { CarouselImage } from "./resource-card/CarouselImage";
import { ImageViewer } from "./resource-card/ImageViewer";
import type { ResourceCardProps, ResourceCardGridProps } from "./resource-card/types";

export type { ResourceCardProps, ResourceCardGridProps } from "./resource-card/types";

const CAROUSEL_HEIGHT = 176;
const PRELOAD_NEIGHBORS = 2;

export const ResourceCardGrid = memo(({ children, className }: ResourceCardGridProps) => (
  <div className={cn("not-prose flex flex-wrap gap-4", className)}>
    {children}
  </div>
));
ResourceCardGrid.displayName = "ResourceCardGrid";

export const ResourceCard = memo(({
  name,
  description,
  version,
  dependencies = [],
  images = [],
  downloadUrl,
  className,
}: ResourceCardProps) => {
  const hasImages = images.length > 0;
  const hasDependencies = dependencies.length > 0;
  const hasMultipleImages = images.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageStates, setImageStates] = useState<Map<string, { loaded: boolean; error: boolean }>>(
    () => new Map()
  );
  const [viewerOpen, setViewerOpen] = useState(false);

  const navigateCarousel = useCallback((direction: "prev" | "next") => {
    setCurrentIndex(prev =>
      direction === "prev"
        ? (prev - 1 + images.length) % images.length
        : (prev + 1) % images.length
    );
  }, [images.length]);

  const handleImageLoad = useCallback((src: string) => {
    setImageStates(prev => new Map(prev).set(src, { loaded: true, error: false }));
  }, []);

  const handleImageError = useCallback((src: string) => {
    setImageStates(prev => new Map(prev).set(src, { loaded: false, error: true }));
    console.error(`Failed to load image: ${src}`);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!hasMultipleImages) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); navigateCarousel("prev"); }
    if (e.key === "ArrowRight") { e.preventDefault(); navigateCarousel("next"); }
  }, [hasMultipleImages, navigateCarousel]);

  const imagesToPreload = useMemo(() => {
    const set = new Set<number>();
    for (let i = 1; i <= PRELOAD_NEIGHBORS; i++) {
      set.add((currentIndex + i) % images.length);
    }
    return set;
  }, [currentIndex, images.length]);

  return (
    <>
      <DuckCard
        className={cn(
          "w-96 shrink-0 flex flex-col border-amber-900/20 bg-duck-stone/40 hover:border-amber-700/30 transition-colors",
          className
        )}
      >
        <DuckCardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <DuckCardTitle className="flex items-center gap-2 text-amber-100">
              <Package size={15} className="text-amber-500/60 shrink-0" aria-hidden="true" />
              {name}
            </DuckCardTitle>
            {version && (
              <DuckBadge
                variant="outline"
                className="text-xs bg-amber-900/30 text-amber-400 border-amber-700/30"
              >
                v{version}
              </DuckBadge>
            )}
          </div>
          <DuckCardDescription className="text-amber-100/60 mt-2">
            {description}
          </DuckCardDescription>
        </DuckCardHeader>

        <DuckCardContent className="space-y-4 pt-0 flex flex-col flex-1">
          {hasImages && (
            <div className="space-y-2">
              <p className="text-xs text-amber-100/40 uppercase tracking-wider">
                Изображения
              </p>

              <div
                className="not-prose relative group overflow-hidden rounded-xl border border-amber-900/20 bg-black/30"
                style={{ height: `${CAROUSEL_HEIGHT}px` }}
                onKeyDown={handleKeyDown}
                role="region"
                aria-label="Карусель изображений"
                aria-live="polite"
                tabIndex={0}
              >
                {images.map((image, index) => (
                  <CarouselImage
                    key={image.src}
                    image={image}
                    index={index}
                    currentIndex={currentIndex}
                    isLoaded={imageStates.get(image.src)?.loaded ?? false}
                    onLoad={() => handleImageLoad(image.src)}
                    onError={() => handleImageError(image.src)}
                    shouldPreload={imagesToPreload.has(index)}
                    onOpenViewer={() => setViewerOpen(true)}
                  />
                ))}

                {hasMultipleImages && (
                  <>
                    <div className="absolute inset-y-0 left-0 w-16 bg-linear-to-r from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true" />
                    <div className="absolute inset-y-0 right-0 w-16 bg-linear-to-l from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true" />

                    <button
                      onClick={() => navigateCarousel("prev")}
                      className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 z-20",
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        "bg-black/60 border border-amber-900/30 text-amber-300",
                        "opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-105",
                        "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      )}
                      aria-label="Предыдущее изображение"
                      type="button"
                    >
                      <ChevronLeft size={18} aria-hidden="true" />
                    </button>

                    <button
                      onClick={() => navigateCarousel("next")}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 z-20",
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        "bg-black/60 border border-amber-900/30 text-amber-300",
                        "opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-105",
                        "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      )}
                      aria-label="Следующее изображение"
                      type="button"
                    >
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>

                    <CarouselIndicators
                      total={images.length}
                      current={currentIndex}
                      onSelect={setCurrentIndex}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {hasDependencies && (
            <div className="space-y-2">
              <p className="text-xs text-amber-100/40 uppercase tracking-wider">
                Зависимости
              </p>
              <div className="flex flex-wrap gap-2">
                {dependencies.map((dep) => (
                  <DependencyBadge key={dep.name} dep={dep} />
                ))}
              </div>
            </div>
          )}

          <div className="flex-1" aria-hidden="true" />

          <DuckButton
            asChild
            size="lg"
            className="border border-amber-900/30 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40 hover:text-amber-100 hover:border-amber-700/50"
          >
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Скачать ${name}`}
            >
              <Download size={16} className="mr-2" aria-hidden="true" />
              Скачать
            </a>
          </DuckButton>
        </DuckCardContent>
      </DuckCard>

      {hasImages && (
        <ImageViewer
          images={images}
          initialIndex={currentIndex}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}
    </>
  );
});
ResourceCard.displayName = "ResourceCard";

"use client";

import { memo, useState, useCallback, useMemo } from "react";
import {
  Package,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
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
import { VersionSelector } from "./resource-card/VersionSelector";
import { useModrinth } from "./resource-card/useModrinth";
import type {
  ResourceCardProps,
  ResourceCardGridProps,
  ResourceImage,
  Dependency,
  ModrinthVersion,
} from "./resource-card/types";

export type { ResourceCardProps, ResourceCardGridProps } from "./resource-card/types";

const CAROUSEL_HEIGHT = 176;
const PRELOAD_NEIGHBORS = 2;

export const ResourceCardGrid = memo(({ children, className }: ResourceCardGridProps) => (
  <div className={cn("not-prose flex flex-wrap gap-4", className)}>
    {children}
  </div>
));
ResourceCardGrid.displayName = "ResourceCardGrid";

const SkeletonCard = memo(({ className }: { className?: string }) => (
  <DuckCard
    className={cn(
      "w-96 shrink-0 flex flex-col border-amber-900/20 bg-duck-stone/40",
      className
    )}
  >
    <DuckCardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <Loader2 size={15} className="text-amber-500/60 shrink-0 animate-spin" />
        <div className="h-4 w-40 rounded bg-amber-900/30 animate-pulse" />
      </div>
      <div className="mt-2 space-y-2">
        <div className="h-3 w-full rounded bg-amber-900/20 animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-amber-900/20 animate-pulse" />
      </div>
    </DuckCardHeader>
    <DuckCardContent className="pt-0 space-y-3">
      <div
        className="rounded-xl border border-amber-900/20 bg-black/30 animate-pulse"
        style={{ height: `${CAROUSEL_HEIGHT}px` }}
      />
      <div className="h-10 w-full rounded-lg bg-amber-900/30 animate-pulse" />
      <div className="h-10 w-full rounded-lg bg-amber-900/20 animate-pulse" />
    </DuckCardContent>
  </DuckCard>
));
SkeletonCard.displayName = "SkeletonCard";

const ErrorCard = memo(({ message, className }: { message: string; className?: string }) => (
  <DuckCard
    className={cn(
      "w-96 shrink-0 flex flex-col border-red-900/30 bg-duck-stone/40",
      className
    )}
  >
    <DuckCardHeader className="pb-3">
      <DuckCardTitle className="flex items-center gap-2 text-red-400">
        <AlertCircle size={15} className="shrink-0" />
        Ошибка загрузки
      </DuckCardTitle>
      <DuckCardDescription className="text-red-400/60 mt-2 text-xs">
        {message}
      </DuckCardDescription>
    </DuckCardHeader>
  </DuckCard>
));
ErrorCard.displayName = "ErrorCard";

// ─── Card body ────────────────────────────────────────────────────────────────

interface ResourceCardBodyProps {
  name: string;
  description: string;
  version?: string;
  modrinthVersions?: ModrinthVersion[];
  dependencies: Dependency[];
  images: ResourceImage[];
  downloadUrl?: string;
  modrinthUrl?: string;
  className?: string;
}

const ResourceCardBody = memo(({
  name,
  description,
  version,
  modrinthVersions,
  dependencies,
  images,
  downloadUrl,
  modrinthUrl,
  className,
}: ResourceCardBodyProps) => {
  const hasImages = images.length > 0;
  const hasDependencies = dependencies.length > 0;
  const hasMultipleImages = images.length > 1;
  const hasVersionSelector = !!modrinthVersions && modrinthVersions.length > 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageStates, setImageStates] = useState<
    Map<string, { loaded: boolean; error: boolean }>
  >(() => new Map());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    () => modrinthVersions?.[0]?.id ?? ""
  );

  const navigateCarousel = useCallback(
    (direction: "prev" | "next") => {
      setCurrentIndex((prev) =>
        direction === "prev"
          ? (prev - 1 + images.length) % images.length
          : (prev + 1) % images.length
      );
    },
    [images.length]
  );

  const handleImageLoad = useCallback((src: string) => {
    setImageStates((prev) => new Map(prev).set(src, { loaded: true, error: false }));
  }, []);

  const handleImageError = useCallback((src: string) => {
    setImageStates((prev) => new Map(prev).set(src, { loaded: false, error: true }));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!hasMultipleImages) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); navigateCarousel("prev"); }
      if (e.key === "ArrowRight") { e.preventDefault(); navigateCarousel("next"); }
    },
    [hasMultipleImages, navigateCarousel]
  );

  const imagesToPreload = useMemo(() => {
    const set = new Set<number>();
    for (let i = 1; i <= PRELOAD_NEIGHBORS; i++) {
      set.add((currentIndex + i) % images.length);
    }
    return set;
  }, [currentIndex, images.length]);

  const versionLabel =
    hasVersionSelector
      ? modrinthVersions!.find((v) => v.id === selectedVersionId)?.version_number
      : version;

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
            {versionLabel && (
              <DuckBadge
                variant="outline"
                className="text-xs bg-amber-900/30 text-amber-400 border-amber-700/30"
              >
                v{versionLabel}
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
                    <div
                      className="absolute inset-y-0 left-0 w-16 bg-linear-to-r from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-y-0 right-0 w-16 bg-linear-to-l from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      aria-hidden="true"
                    />
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

          {hasVersionSelector && (
            <VersionSelector
              versions={modrinthVersions!}
              selectedVersionId={selectedVersionId}
              onSelectVersion={setSelectedVersionId}
            />
          )}

          {!hasVersionSelector && downloadUrl && (
            <div className="flex gap-2">
              <DuckButton
                asChild
                size="lg"
                className="flex-1 border border-amber-900/30 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40 hover:text-amber-100 hover:border-amber-700/50"
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

              {modrinthUrl && (
                <DuckButton
                  asChild
                  size="lg"
                  variant="outline"
                  className="border border-amber-900/30 bg-transparent text-amber-400/70 hover:bg-amber-900/20 hover:text-amber-300 hover:border-amber-700/40 px-3"
                >
                  <a
                    href={modrinthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Открыть ${name} на Modrinth`}
                    title="Открыть на Modrinth"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                </DuckButton>
              )}
            </div>
          )}

          {/* ── Modrinth link below version selector ── */}
          {hasVersionSelector && modrinthUrl && (
            <a
              href={modrinthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-amber-400/40 hover:text-amber-400/70 transition-colors"
            >
              <ExternalLink size={11} aria-hidden="true" />
              Modrinth
            </a>
          )}
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
ResourceCardBody.displayName = "ResourceCardBody";

// ─── Public export ────────────────────────────────────────────────────────────

export const ResourceCard = memo((props: ResourceCardProps) => {
  const {
    modrinthId,
    name,
    description,
    version,
    dependencies = [],
    images = [],
    downloadUrl,
    className,
  } = props;

  const { data, status, error } = useModrinth(modrinthId);

  // ── Modrinth mode ──────────────────────────────────────────────────────────
  if (modrinthId) {
    if (status === "loading" || status === "idle") {
      return <SkeletonCard className={className} />;
    }
    if (status === "error") {
      return (
        <ErrorCard
          message={error ?? "Не удалось загрузить данные с Modrinth"}
          className={className}
        />
      );
    }
    if (status === "success" && data) {
      return (
        <ResourceCardBody
          name={name ?? data.name}
          description={description ?? data.description}
          modrinthVersions={data.versions}
          dependencies={dependencies.length > 0 ? dependencies : data.dependencies}
          images={images.length > 0 ? images : data.images}
          modrinthUrl={`https://modrinth.com/project/${data.slug}`}
          className={className}
        />
      );
    }
  }

  if (!name || !description || !downloadUrl) {
    return (
      <ErrorCard
        message="Укажите modrinthId или заполните name, description и downloadUrl вручную."
        className={className}
      />
    );
  }

  return (
    <ResourceCardBody
      name={name}
      description={description}
      version={version}
      dependencies={dependencies}
      images={images}
      downloadUrl={downloadUrl}
      className={className}
    />
  );
});
ResourceCard.displayName = "ResourceCard";
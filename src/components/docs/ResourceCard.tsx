"use client";

import { memo, useState, useCallback, useMemo } from "react";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EXTERNAL_APIS } from "@/config/external-apis";
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
import { RESOURCE_TYPE_META, DEFAULT_RESOURCE_TYPE } from "./resource-card/resourceTypes";
import type {
  ResourceCardProps,
  ResourceCardGridProps,
  ResourceImage,
  ResourceType,
  Dependency,
  ModrinthVersion,
} from "./resource-card/types";

export type { ResourceCardProps, ResourceCardGridProps } from "./resource-card/types";

const CAROUSEL_HEIGHT = 176;
const PRELOAD_NEIGHBORS = 2;
const CARD_WIDTH_CLASS = "w-full";

export const ResourceCardGrid = memo(({ children, className }: ResourceCardGridProps) => (
  <div
    className={cn(
      "not-prose grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4",
      className
    )}
  >
    {children}
  </div>
));
ResourceCardGrid.displayName = "ResourceCardGrid";

const SkeletonCard = memo(({ className }: { className?: string }) => (
  <DuckCard
    className={cn(
      CARD_WIDTH_CLASS,
      "flex flex-col border-primary/20 bg-duck-stone/40",
      className
    )}
  >
    <DuckCardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <Loader2 size={15} className="text-foreground/60 shrink-0 animate-spin" />
        <div className="h-4 w-40 rounded bg-primary/30 animate-pulse" />
      </div>
      <div className="mt-2 space-y-2">
        <div className="h-3 w-full rounded bg-primary/20 animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-primary/20 animate-pulse" />
      </div>
    </DuckCardHeader>
    <DuckCardContent className="pt-0 space-y-3">
      <div
        className="rounded-xl border border-primary/20 bg-muted animate-pulse"
        style={{ height: `${CAROUSEL_HEIGHT}px` }}
      />
      <div className="h-10 w-full rounded-lg bg-primary/30 animate-pulse" />
      <div className="h-10 w-full rounded-lg bg-primary/20 animate-pulse" />
    </DuckCardContent>
  </DuckCard>
));
SkeletonCard.displayName = "SkeletonCard";

const ErrorCard = memo(({ message, className }: { message: string; className?: string }) => (
  <DuckCard
    className={cn(
      CARD_WIDTH_CLASS,
      "flex flex-col border-red-900/30 bg-duck-stone/40",
      className
    )}
  >
    <DuckCardHeader className="pb-3">
      <DuckCardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle size={15} className="shrink-0" />
        Ошибка загрузки
      </DuckCardTitle>
      <DuckCardDescription className="text-red-600/60 dark:text-red-400/60 mt-2 text-xs">
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
  type: ResourceType;
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
  type,
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
  const { icon: TypeIcon, label: typeLabel } = RESOURCE_TYPE_META[type];

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

  // The version selector already shows the selected version prominently, so
  // a plain version badge here would just repeat it — only show one for the
  // manual/static path, where the badge is the only place version appears.
  // Resource packs don't carry a meaningful "version" the way mods do, so
  // never show the badge for that type.
  const staticVersionLabel =
    hasVersionSelector || type === "resourcepack" ? undefined : version;

  return (
    <>
      <DuckCard
        className={cn(
          CARD_WIDTH_CLASS,
          "flex flex-col border-primary/20 bg-duck-stone/40 hover:border-primary/40 transition-colors",
          className
        )}
      >
        <DuckCardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <DuckCardTitle className="flex items-center gap-2 text-foreground">
              <TypeIcon size={15} className="text-foreground/60 shrink-0" aria-hidden="true" />
              {name}
            </DuckCardTitle>
            <div className="flex items-center gap-1.5">
              <DuckBadge
                variant="outline"
                className="text-xs bg-muted text-foreground/60 border-primary/25"
              >
                {typeLabel}
              </DuckBadge>
              {staticVersionLabel && (
                <DuckBadge
                  variant="outline"
                  className="text-xs bg-primary/30 text-foreground border-primary/40"
                >
                  v{staticVersionLabel}
                </DuckBadge>
              )}
            </div>
          </div>
          <DuckCardDescription className="text-foreground/60 mt-2">
            {description}
          </DuckCardDescription>
        </DuckCardHeader>

        <DuckCardContent className="space-y-4 pt-0 flex flex-col flex-1">
          {hasImages && (
            <div className="space-y-2">
              <p className="text-xs text-foreground/40 uppercase tracking-wider">
                Изображения
              </p>
              <div
                className="not-prose relative group overflow-hidden rounded-xl border border-primary/20 bg-muted/20 dark:bg-black/30"
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
                      className="absolute inset-y-0 left-0 w-16 bg-linear-to-r from-black/30 dark:from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-y-0 right-0 w-16 bg-linear-to-l from-black/30 dark:from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                      aria-hidden="true"
                    />
                    <button
                      onClick={() => navigateCarousel("prev")}
                      className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 z-20",
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        "bg-black/50 border border-white/20 text-white/90",
                        "opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 hover:scale-105",
                        "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
                        "bg-black/50 border border-white/20 text-white/90",
                        "opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 hover:scale-105",
                        "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
              <p className="text-xs text-foreground/40 uppercase tracking-wider">
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
                className="flex-1 border border-primary/30 bg-primary/30 text-foreground hover:bg-primary/40 hover:text-foreground hover:border-primary/50"
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
                  className="border border-primary/30 bg-transparent text-foreground/70 hover:bg-primary/20 hover:text-foreground hover:border-primary/40 px-3"
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
              className="flex items-center justify-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
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
    type,
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
          type={type ?? data.type}
          modrinthVersions={data.versions}
          dependencies={dependencies.length > 0 ? dependencies : data.dependencies}
          images={images.length > 0 ? images : data.images}
          modrinthUrl={EXTERNAL_APIS.modrinth.projectUrl(data.slug)}
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
      type={type ?? DEFAULT_RESOURCE_TYPE}
      version={version}
      dependencies={dependencies}
      images={images}
      downloadUrl={downloadUrl}
      className={className}
    />
  );
});
ResourceCard.displayName = "ResourceCard";

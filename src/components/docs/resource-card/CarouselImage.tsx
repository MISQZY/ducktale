import { memo } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";
import type { ResourceImage } from "./types";

const IMAGE_QUALITY = 80;
const TRANSITION_DURATION = 300;

interface CarouselImageProps {
  image: ResourceImage;
  index: number;
  currentIndex: number;
  isLoaded: boolean;
  onLoad: () => void;
  onError: () => void;
  shouldPreload: boolean;
  onOpenViewer: () => void;
}

export const CarouselImage = memo(({
  image,
  index,
  currentIndex,
  isLoaded,
  onLoad,
  onError,
  shouldPreload,
  onOpenViewer,
}: CarouselImageProps) => {
  const isActive = index === currentIndex;

  return (
    <div
      id={`carousel-image-${index}`}
      className="absolute inset-0 overflow-hidden rounded-xl"
      role="tabpanel"
      aria-hidden={!isActive}
    >
      {(isActive || shouldPreload) && (
        <Image
          src={image.src}
          alt={image.alt}
          title={image.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={cn(
            "object-cover object-center transition-opacity",
            isActive ? "opacity-100" : "opacity-0"
          )}
          style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
          onLoad={onLoad}
          onError={onError}
          priority={isActive}
          quality={IMAGE_QUALITY}
          loading={isActive ? "eager" : "lazy"}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMzMzIi8+PC9zdmc+"
        />
      )}
      {isActive && !isLoaded && <LoadingSpinner />}

      {isActive && (
        <button
          onClick={onOpenViewer}
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center",
            "bg-black/0 hover:bg-black/40 transition-colors duration-200",
            "opacity-0 group-hover:opacity-100",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500",
            "cursor-zoom-in rounded-xl"
          )}
          aria-label="Открыть полноэкранный просмотр"
          type="button"
        >
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full",
            "bg-black/60 border border-white/10 text-white/80 text-xs",
            "backdrop-blur-sm scale-90 group-hover:scale-100 transition-transform duration-200 text-amber-400" 
          )}>
            <ZoomIn size={14} aria-hidden="true" />
            <span>Просмотр</span>
          </div>
        </button>
      )}
    </div>
  );
});
CarouselImage.displayName = "CarouselImage";

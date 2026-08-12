import { memo } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";
import type { ResourceImage } from "./types";

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
      className={cn(
        "absolute inset-0 overflow-hidden rounded-xl z-0",
        isActive ? "cursor-zoom-in" : "pointer-events-none"
      )}
      role="tabpanel"
      aria-hidden={!isActive}
      onClick={isActive ? onOpenViewer : undefined}
    >
      {(isActive || shouldPreload) && (
        <>
          <div className="absolute inset-0 -z-10 scale-110 blur-xl opacity-50 dark:opacity-60 pointer-events-none">
            <Image
              src={image.src}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 384px"
              className={cn(
                "object-cover object-center transition-opacity",
                isActive ? "opacity-100" : "opacity-0"
              )}
              style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
              priority={isActive}
              unoptimized={image.unoptimized}
            />
          </div>
          <Image
            src={image.src}
            alt={image.alt}
            title={image.title}
            fill
            sizes="(max-width: 640px) 100vw, 384px"
            className={cn(
              "object-contain object-center transition-opacity",
              isActive ? "opacity-100" : "opacity-0"
            )}
            style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
            onLoad={onLoad}
            onError={onError}
            priority={isActive}
            quality={100}
            unoptimized={image.unoptimized}
            loading={isActive ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMzMzIi8+PC9zdmc+"
          />
        </>
      )}
      {isActive && !isLoaded && <LoadingSpinner />}

      {isActive && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none z-10",
            "bg-black/0 group-hover:bg-black/15 dark:group-hover:bg-black/30 transition-colors duration-200"
          )}
          aria-hidden="true"
        >
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full",
            "bg-black/60 border border-white/10 text-white/90 text-xs",
            "backdrop-blur-sm opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200"
          )}>
            <ZoomIn size={14} aria-hidden="true" />
            <span>Просмотр</span>
          </div>
        </div>
      )}
    </div>
  );
});
CarouselImage.displayName = "CarouselImage";
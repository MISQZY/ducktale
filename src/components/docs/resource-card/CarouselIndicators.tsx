import { memo } from "react";
import { cn } from "@/lib/utils";

interface CarouselIndicatorsProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

export const CarouselIndicators = memo(({ total, current, onSelect }: CarouselIndicatorsProps) => (
  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20" role="tablist">
    {Array.from({ length: total }).map((_, index) => (
      <button
        key={index}
        onClick={() => onSelect(index)}
        className={cn(
          "h-1.5 rounded-full transition-all duration-200",
          index === current
            ? "w-5 bg-amber-400"
            : "w-1.5 bg-amber-400/40 hover:bg-amber-400/70"
        )}
        role="tab"
        aria-label={`Перейти к изображению ${index + 1}`}
        aria-selected={index === current}
        aria-controls={`carousel-image-${index}`}
      />
    ))}
  </div>
));
CarouselIndicators.displayName = "CarouselIndicators";

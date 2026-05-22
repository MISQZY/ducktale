"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, Package, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Dependency {
  name: string;
  url: string;
}

interface ResourceImage {
  src: string;
  alt: string;
  title?: string;
}

interface ResourceCardProps {
  name: string;
  description: string;
  version?: string;
  dependencies?: Dependency[];
  images?: ResourceImage[];
  downloadUrl: string;
  className?: string;
}

export function ResourceCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-4">
      {children}
    </div>
  );
}

export function ResourceCard({
  name,
  description,
  version,
  dependencies = [],
  images = [],
  downloadUrl,
  className,
}: ResourceCardProps) {
  const hasImages = images.length > 0;
  const hasDependencies = dependencies.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevImage = () =>
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () =>
    setCurrentIndex((i) => (i + 1) % images.length);

  return (
    <Card
      className={cn(
        "w-96 shrink-0 flex flex-col border-amber-900/20 bg-duck-stone/40 hover:border-amber-700/30 transition-colors",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-amber-100">
            <Package size={15} className="text-amber-500/60 shrink-0" />
            {name}
          </CardTitle>

          {version && (
            <Badge
              variant="outline"
              className="text-xs bg-amber-900/30 text-amber-400 border-amber-700/30"
            >
              v{version}
            </Badge>
          )}
        </div>

        <CardDescription className="text-amber-100/60 mt-2">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-0 flex flex-col flex-1">
        {hasImages && (
          <div className="space-y-2">
            <p className="text-xs text-amber-100/40 uppercase tracking-wider">
              Изображения
            </p>

            <div className="relative group overflow-hidden rounded-xl border border-amber-900/20 bg-black/30" style={{ height: "176px" }}>
              <div className="relative w-full" style={{ height: "176px" }}>
                {images.map((image, index) => (
                  <img
                    key={`${image.src}-${index}`}
                    src={image.src}
                    alt={image.alt}
                    title={image.title}
                    loading="lazy"
                    style={{
                      display: "block",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      margin: 0,
                      objectPosition: "center center",
                      opacity: index === currentIndex ? 1 : 0,
                      transition: "opacity 0.3s",
                    }}
                  />
                ))}
              </div>

              {images.length > 1 && (
                <>
                  <div className="absolute inset-y-0 left-0 w-16 bg-linear-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-y-0 right-0 w-16 bg-linear-to-l from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <button
                    onClick={prevImage}
                    className={cn(
                      "absolute left-2 top-1/2 -translate-y-1/2 z-10",
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      "bg-black/50 border border-amber-900/30 text-amber-300",
                      "opacity-0 group-hover:opacity-100 transition-all duration-200",
                      "hover:bg-black/70 hover:text-amber-100 focus:outline-none"
                    )}
                    aria-label="Предыдущее изображение"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    onClick={nextImage}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 z-10",
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      "bg-black/50 border border-amber-900/30 text-amber-300",
                      "opacity-0 group-hover:opacity-100 transition-all duration-200",
                      "hover:bg-black/70 hover:text-amber-100 focus:outline-none"
                    )}
                    aria-label="Следующее изображение"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-200 focus:outline-none",
                          index === currentIndex
                            ? "w-4 bg-amber-400"
                            : "w-1.5 bg-amber-400/30 hover:bg-amber-400/60"
                        )}
                        aria-label={`Изображение ${index + 1}`}
                      />
                    ))}
                  </div>
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
                <a
                  key={dep.name}
                  href={dep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                    "border-amber-900/20 bg-black/30 text-amber-300/70",
                    "hover:border-amber-700/40 hover:text-amber-300"
                  )}
                >
                  {dep.name}
                  <ExternalLink size={10} className="opacity-50" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Pushes button to bottom */}
        <div className="flex-1" />

        <Button
          asChild
          size="lg"
          variant="link"
          className="no-underline border-amber-900/30 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 hover:border-amber-700/50 hover:no-underline **:no-underline"
          style={{ textDecoration: "none" }}
        >
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Download size={13} />
            Скачать
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
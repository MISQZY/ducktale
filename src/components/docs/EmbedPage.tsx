"use client";

import { useState, useCallback, useRef, ReactNode, RefObject } from "react";
import { Maximize2, Minimize2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFullscreen } from "@/hooks/useFullscreen";

export interface EmbedPageProps {
  title?: string;
  height?: number | string;
  children?: ReactNode;
  header?: ReactNode | ((props: { fullscreen: boolean; toggleFullscreen: () => void; closeButtonRef: RefObject<HTMLButtonElement | null> }) => ReactNode);
  expandLabel?: string;
  collapseLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modalMode?: boolean;
}

export function EmbedPage({
  title,
  height = 500,
  children,
  header,
  expandLabel = "Развернуть на весь экран",
  collapseLabel = "Свернуть",
  open,
  onOpenChange,
  modalMode = false,
}: EmbedPageProps) {
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isControlled = open !== undefined;
  const fullscreen = isControlled ? open : internalFullscreen;

  const [placeholderHeight, setPlaceholderHeight] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (isControlled) onOpenChange?.(false);
    else setInternalFullscreen(false);
  }, [isControlled, onOpenChange]);

  const { closeButtonRef } = useFullscreen({ open: fullscreen, onClose: handleClose });

  const toggleFullscreen = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(!fullscreen);
    } else {
      setInternalFullscreen((v) => {
        if (!v && containerRef.current) {
          setPlaceholderHeight(containerRef.current.offsetHeight);
        }
        return !v;
      });
    }
  }, [isControlled, fullscreen, onOpenChange]);

  const isHeaderFunction = typeof header === "function";

  const defaultHeader = (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/20 bg-card/40 relative z-10">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
      </div>
      <p className="text-foreground/25 text-xs tracking-widest ml-3 font-mono">
        {title}
      </p>
      <div className="ml-auto flex items-center gap-3">
        <button
          ref={closeButtonRef}
          onClick={toggleFullscreen}
          aria-label={fullscreen ? collapseLabel : expandLabel}
          title={fullscreen ? collapseLabel : expandLabel}
          className="flex items-center justify-center text-primary/40 hover:text-primary transition-colors outline-none rounded"
        >
          {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
        <Lock size={10} className="text-primary/40" />
      </div>
    </div>
  );

  if (modalMode && !fullscreen) return null;

  return (
    <>
      {fullscreen && (
        <div style={{ height: placeholderHeight }} className="w-full my-4" aria-hidden="true" />
      )}

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-500 ease-out"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <div
        ref={containerRef}
        role={fullscreen ? "dialog" : undefined}
        aria-modal={fullscreen ? true : undefined}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-primary/25 bg-card/60 not-prose",
          fullscreen ? "fixed inset-10 z-50 flex flex-col bg-card animate-in fade-in zoom-in-[0.98] duration-500 ease-out" : "my-4"
        )}
        style={{ 
          boxShadow: "0 0 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,160,23,0.06)"
        }}
      >
        {(["tl", "tr", "bl", "br"] as const).map((p) => (
          <div
            key={p}
            className={cn(
              "absolute w-6 h-6 pointer-events-none z-20 border-primary/40",
              p === "tl" && "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
              p === "tr" && "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
              p === "bl" && "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
              p === "br" && "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl"
            )}
          />
        ))}

        {isHeaderFunction 
          ? header({ fullscreen, toggleFullscreen, closeButtonRef }) 
          : (header || defaultHeader)}

        <div 
          className={cn("relative w-full min-h-0", fullscreen ? "flex-1 flex flex-col" : "")}
          style={fullscreen ? undefined : { height }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export interface PageEmbedProps extends Omit<EmbedPageProps, "children" | "header"> {
  src: string;
}

export function PageEmbed({ src, title = "Embedded page", height = 500, ...rest }: PageEmbedProps) {
  return (
    <EmbedPage title={title} height={height} {...rest}>
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 w-full h-full border-none"
        loading="lazy"
        allow="fullscreen"
      />
    </EmbedPage>
  );
}

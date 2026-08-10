"use client";

import { forwardRef } from "react";
import { X } from "lucide-react";

interface FullscreenViewerHeaderProps {
  title: string;
  onClose: () => void;
}

/**
 * Header bar for a fullscreen dialog overlay: a truncated title on the left
 * and a close button on the right. Previously this exact markup (same
 * classNames, same structure) was copy-pasted into both PageEmbed and
 * ImageViewer — extracted here so it only exists once.
 */
export const FullscreenViewerHeader = forwardRef<HTMLButtonElement, FullscreenViewerHeaderProps>(
  ({ title, onClose }, closeButtonRef) => {
    return (
      <div className="relative shrink-0 min-h-11 border-b border-primary/20 bg-card/90 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
        <div className="flex items-center justify-between h-full px-4 py-2">
          <span
            className="text-sm text-primary/90 truncate pr-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Закрыть полноэкранный просмотр"
            className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }
);

FullscreenViewerHeader.displayName = "FullscreenViewerHeader";

/** Shared wrapper classes for the fullscreen overlay container itself. */
export const FULLSCREEN_OVERLAY_CLASS = "fixed inset-0 z-50 flex flex-col bg-background";

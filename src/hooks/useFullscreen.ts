"use client";

import { useEffect, useCallback, useRef } from "react";

interface UseFullscreenOptions {
  open: boolean;
  onClose: () => void;
  withArrows?: {
    onPrev: () => void;
    onNext: () => void;
  };
}


export function useFullscreen({ open, onClose, withArrows }: UseFullscreenOptions) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);


  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);


  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);


  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (withArrows) {
        if (e.key === "ArrowLeft")  { e.preventDefault(); withArrows.onPrev(); }
        if (e.key === "ArrowRight") { e.preventDefault(); withArrows.onNext(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, withArrows]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  return { closeButtonRef, handleClose };
}

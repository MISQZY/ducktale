"use client";

import { useEffect, useMemo } from "react";
import { Trash2, Paperclip, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * A picked-but-not-yet-sent file, shown in the composer before submit — an
 * image thumbnail for images, a filename chip for everything else. Shared by
 * every message composer (threads, tickets, reports, applications) —
 * originally only ThreadView had the thumbnail variant, the others just
 * showed a plain chip even for images.
 */
export function SelectedFilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/");
  // Recreated only when `file` itself changes, not on every re-render —
  // revoked on unmount/change so picking several images in a row doesn't
  // leak a blob URL per keystroke-triggered re-render.
  const url = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage]);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (isImage && url) {
    return (
      <div className="relative group shrink-0 rounded-md overflow-hidden border border-border h-12 w-12 sm:h-16 sm:w-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={file.name} className="object-cover w-full h-full" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={onRemove}
            className="text-white hover:text-red-400 transition-colors"
            aria-label={`Remove ${file.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2 h-7 sm:h-8 bg-card shrink-0">
      <Paperclip size={10} className="shrink-0 opacity-50" />
      <span className="truncate max-w-[120px]">{file.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:text-destructive transition-colors"
        aria-label={`Remove ${file.name}`}
      >
        <X size={10} />
      </button>
    </Badge>
  );
}

"use client";

import { Paperclip, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * A picked-but-not-yet-sent file, shown in the composer before submit.
 * Shared by TicketThread/ReportThread/ApplicationThread (identical in all
 * three). Not used by ThreadView, whose equivalent (FilePreview) renders an
 * actual image thumbnail for picked images instead of just a filename chip.
 */
export function SelectedFileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <Badge
      variant="secondary"
      className="h-auto gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border-primary/20 text-foreground/70 text-[0.65rem]"
    >
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

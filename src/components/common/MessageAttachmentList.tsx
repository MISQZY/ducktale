"use client";

import { useState } from "react";
import type { useTranslations } from "next-intl";
import { FileText, Download, ImageOff } from "lucide-react";
import { EmbedImage } from "@/components/common/EmbedImage";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
} from "@/components/kibo-ui/video-player";

export interface MessageAttachmentData {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}

type Translator = ReturnType<typeof useTranslations>;

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function AttachmentImageError({ att, baseUrl, t }: { att: MessageAttachmentData; baseUrl: string; t: Translator }) {
  const url = `${baseUrl}/${att.id}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-destructive/25 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10 transition-colors group/file"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 shrink-0">
        <ImageOff size={16} className="text-destructive/70" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs text-foreground/80 truncate">{att.filename}</span>
        <span className="text-[0.6rem] text-destructive/60">{t("imageLoadError")}</span>
      </div>
    </a>
  );
}

function AttachmentImage({ att, baseUrl, t }: { att: MessageAttachmentData; baseUrl: string; t: Translator }) {
  const [failed, setFailed] = useState(false);
  const url = `${baseUrl}/${att.id}`;

  if (failed) return <AttachmentImageError att={att} baseUrl={baseUrl} t={t} />;

  return (
    <EmbedImage
      url={url}
      filename={att.filename}
      className="block group/img rounded-xl overflow-hidden border border-primary/15 bg-card/40 hover:border-primary/30 transition-colors w-max"
      imgClassName="max-w-full max-h-[280px] object-contain rounded-xl"
      onError={() => setFailed(true)}
    />
  );
}

function AttachmentVideo({ att, baseUrl }: { att: MessageAttachmentData; baseUrl: string }) {
  const [failed, setFailed] = useState(false);
  const url = `${baseUrl}/${att.id}`;

  if (failed) return <AttachmentFile att={att} baseUrl={baseUrl} />;

  return (
    <VideoPlayer className="w-full max-w-sm aspect-video overflow-hidden rounded-xl border border-primary/15 bg-black">
      <VideoPlayerContent
        src={url}
        preload="metadata"
        className="w-full h-full object-contain"
        onError={() => setFailed(true)}
      />
      <VideoPlayerControlBar>
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBackwardButton />
        <VideoPlayerSeekForwardButton />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay />
        <VideoPlayerMuteButton />
      </VideoPlayerControlBar>
    </VideoPlayer>
  );
}

function AttachmentFile({ att, baseUrl }: { att: MessageAttachmentData; baseUrl: string }) {
  const url = `${baseUrl}/${att.id}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-primary/15 bg-card/40 hover:border-primary/30 hover:bg-card/60 transition-colors group/file"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
        <FileText size={16} className="text-primary/60" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs text-foreground/80 truncate">{att.filename}</span>
        <span className="text-[0.6rem] text-foreground/35">{formatFileSize(att.size)}</span>
      </div>
      <Download size={14} className="text-foreground/30 group-hover/file:text-primary/60 transition-colors shrink-0" />
    </a>
  );
}

/**
 * Renders a message's attachments (image preview, video player, or generic
 * file card) —
 * shared by TicketThread/ReportThread/ApplicationThread, which otherwise
 * each carried a byte-for-byte copy of this differing only in their
 * attachments API prefix. Not used by ThreadView, whose attachment layout
 * (all files in one wrapped row, not stacked) and file-picker preview are
 * genuinely different, not just duplicated.
 */
export function MessageAttachmentList({ attachments, baseUrl, t }: { attachments: MessageAttachmentData[]; baseUrl: string; t: Translator }) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {attachments.map((att) =>
        isImageMime(att.mimeType) ? (
          <AttachmentImage key={att.id} att={att} baseUrl={baseUrl} t={t} />
        ) : isVideoMime(att.mimeType) ? (
          <AttachmentVideo key={att.id} att={att} baseUrl={baseUrl} />
        ) : (
          <AttachmentFile key={att.id} att={att} baseUrl={baseUrl} />
        )
      )}
    </div>
  );
}

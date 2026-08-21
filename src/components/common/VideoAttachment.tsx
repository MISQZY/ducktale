"use client";

import { useRef, useState } from "react";
import { Download, Maximize2 } from "lucide-react";
import { EmbedPage } from "@/components/docs/EmbedPage";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  VideoPlayerVolumeRange,
} from "@/components/kibo-ui/video-player";

interface VideoAttachmentProps {
  url: string;
  filename: string;
  className?: string;
  onError?: () => void;
}

/** Play/seek/time/volume controls — identical for the inline player and its expanded EmbedPage copy below, so it's defined once instead of twice. */
function Controls() {
  return (
    <VideoPlayerControlBar>
      <VideoPlayerPlayButton />
      <VideoPlayerSeekBackwardButton />
      <VideoPlayerSeekForwardButton />
      <VideoPlayerTimeRange />
      <VideoPlayerTimeDisplay />
      <VideoPlayerMuteButton />
      <VideoPlayerVolumeRange />
    </VideoPlayerControlBar>
  );
}

/**
 * A video attachment player — shared by MessageAttachmentList
 * (Ticket/Report/Application) and ThreadView. Mirrors EmbedImage's
 * expand-into-EmbedPage pattern (a hover button opens the same media larger,
 * in the app's own fullscreen dialog chrome, rather than the browser's
 * native video fullscreen) so video and image attachments behave the same
 * way. The inline and expanded copies are separate <video> elements with
 * independent playback state — expanding pauses the inline one so they
 * don't both play audio at once, same tradeoff EmbedImage makes by not
 * syncing anything between its inline and expanded <img>.
 */
export function VideoAttachment({ url, filename, className, onError }: VideoAttachmentProps) {
  const [expanded, setExpanded] = useState(false);
  const inlineVideoRef = useRef<HTMLVideoElement>(null);

  return (
    <>
      <div className={cn("relative group/video", className)}>
        <VideoPlayer className="w-full h-full">
          <VideoPlayerContent
            ref={inlineVideoRef}
            src={url}
            preload="metadata"
            slot="media"
            className="w-full h-full object-contain"
            onError={onError}
          />
          <Controls />
        </VideoPlayer>
        <button
          type="button"
          onClick={() => {
            inlineVideoRef.current?.pause();
            setExpanded(true);
          }}
          aria-label="Развернуть"
          title="Развернуть"
          className="absolute top-2 right-2 z-10 bg-black/60 rounded p-1.5 opacity-0 group-hover/video:opacity-100 transition-opacity text-white hover:text-primary"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      <EmbedPage
        title={filename}
        open={expanded}
        onOpenChange={setExpanded}
        modalMode
        header={({ toggleFullscreen, closeButtonRef }) => (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/20 bg-card relative z-10 shrink-0">
            <div className="flex gap-1.5 group/mac">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <button
                ref={closeButtonRef}
                onClick={toggleFullscreen}
                className="relative w-2.5 h-2.5 rounded-full bg-primary/70 flex items-center justify-center hover:bg-primary transition-colors outline-none cursor-pointer group/mac-btn"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <p className="text-foreground/25 text-xs tracking-widest ml-3 font-mono truncate max-w-[200px] sm:max-w-[400px]">
              {filename}
            </p>
          </div>
        )}
      >
        <div className="relative flex items-center justify-center w-full h-full p-4 bg-black/40">
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <a
              href={url}
              download={filename}
              className={cn(buttonVariants({ variant: "outline", size: "icon" }), "bg-stone-800 text-foreground/70 hover:text-foreground")}
              title="Download"
            >
              <Download size={16} />
            </a>
          </div>
          <VideoPlayer className="w-full h-full overflow-hidden rounded-xl">
            <VideoPlayerContent src={url} preload="metadata" slot="media" className="w-full h-full object-contain" />
            <Controls />
          </VideoPlayer>
        </div>
      </EmbedPage>
    </>
  );
}

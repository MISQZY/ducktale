"use client";

import { useState } from "react";
import { Download, Minimize2, Maximize2 } from "lucide-react";
import { EmbedPage } from "@/components/docs/EmbedPage";
import { cn } from "@/lib/utils";

interface EmbedImageProps {
  url: string;
  filename: string;
  className?: string;
  imgClassName?: string;
  onError?: () => void;
}

export function EmbedImage({ url, filename, className, imgClassName, onError }: EmbedImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={cn("relative group cursor-pointer", className)}
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={url} 
          alt={filename} 
          className={cn("object-cover w-full h-full", imgClassName)} 
          onError={onError}
          loading="lazy"
        />
        <div className="absolute top-1 right-1 bg-black/60 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={url}
            download={filename}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="text-white hover:text-primary transition-colors block"
            title="Download"
          >
            <Download size={12} />
          </a>
        </div>
      </div>

      <EmbedPage
        title={filename}
        open={open}
        onOpenChange={setOpen}
        modalMode={true}
        header={({ fullscreen, toggleFullscreen, closeButtonRef }) => (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/20 bg-card relative z-10 shrink-0">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <p className="text-foreground/25 text-xs tracking-widest ml-3 font-mono truncate max-w-[200px] sm:max-w-[400px]">
              {filename}
            </p>
            <div className="ml-auto flex items-center gap-4">
              <a
                href={url}
                download={filename}
                className="flex items-center justify-center text-primary/40 hover:text-primary transition-colors outline-none rounded"
                title="Download"
              >
                <Download size={14} />
              </a>
              <button
                ref={closeButtonRef}
                onClick={toggleFullscreen}
                className="flex items-center justify-center text-primary/40 hover:text-primary transition-colors outline-none rounded"
              >
                {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>
        )}
      >
        <div className="flex items-center justify-center w-full h-full p-4 bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={filename} className="object-contain max-w-full max-h-full" />
        </div>
      </EmbedPage>
    </>
  );
}

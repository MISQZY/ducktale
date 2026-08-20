"use client";

import { useState } from "react";
import { Download} from "lucide-react";
import { EmbedPage } from "@/components/docs/EmbedPage";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={filename} className="object-contain max-w-full max-h-full" />
        </div>
      </EmbedPage>
    </>
  );
}

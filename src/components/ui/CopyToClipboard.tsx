"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CopyToClipboardProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export default function CopyToClipboard({
  value,
  className,
  children,
}: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Скопируйте адрес вручную:", value);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handleCopy}
            aria-label={`Скопировать ${value}`}
            className={cn(
              "h-auto w-full p-0 bg-transparent border-0 hover:bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              className
            )}
          >
            {children ?? (
              <div className="w-full flex items-center justify-center gap-3 rounded-lg bg-muted border border-primary/20 px-6 py-4 cursor-pointer">
                <span className="font-mono text-2xl text-foreground tracking-wide">
                  {value}
                </span>
                {copied ? (
                  <Check size={18} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={18} className="text-foreground/50 shrink-0" />
                )}
              </div>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          className={cn(
            copied
              ? "bg-emerald-500/90 text-white border-emerald-500/50"
              : "bg-popover text-popover-foreground border-primary/30"
          )}
        >
          {copied ? "✓ Скопировано!" : "Нажмите, чтобы скопировать"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
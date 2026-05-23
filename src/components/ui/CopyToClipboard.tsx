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
              <div className="w-full flex items-center justify-center gap-3 rounded-lg bg-black/40 border border-amber-900/20 px-6 py-4 cursor-pointer">
                <span className="font-mono text-2xl text-amber-300 tracking-wide">
                  {value}
                </span>
                {copied ? (
                  <Check size={18} className="text-green-400 shrink-0" />
                ) : (
                  <Copy size={18} className="text-amber-500/50 shrink-0" />
                )}
              </div>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          className={cn(
            copied
              ? "bg-green-500/90 text-white border-green-500/50"
              : "bg-black/80 text-amber-200 border-amber-500/30"
          )}
        >
          {copied ? "✓ Скопировано!" : "Нажмите, чтобы скопировать"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
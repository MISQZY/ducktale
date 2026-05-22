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
}

export default function CopyToClipboard({ value, className }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={copied ? true : undefined}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handleCopy}
            aria-label={`Скопировать адрес ${value}`}
            className={cn(
              "inline-flex items-center gap-3 h-auto px-8 py-4 rounded-xl",
              "border-amber-500/20 bg-black/40 hover:bg-black/60",
              "hover:border-amber-500/50 focus-visible:ring-amber-400/60",
              "transition-all duration-200",
              copied && "border-green-500/50 bg-green-500/10",
              className
            )}
          >
            <code
              className={cn(
                "text-xl md:text-2xl tracking-widest font-mono transition-colors duration-200",
                copied ? "text-green-400" : "text-amber-300"
              )}
            >
              {value}
            </code>
            <span
              className={cn(
                "transition-all duration-200",
                copied
                  ? "text-green-400"
                  : "text-amber-500/60 group-hover:text-amber-400"
              )}
            >
              {copied ? <Check size={18} strokeWidth={2.5} /> : <Copy size={18} />}
            </span>
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
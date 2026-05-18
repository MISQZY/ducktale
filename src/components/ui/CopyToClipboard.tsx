"use client";
 
import { useState } from "react";
 
interface CopyToClipboardProps {
  value: string;
}
 
export default function CopyToClipboard({ value }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);
 
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
 
  return (
    <div className="relative group inline-flex">
      {/* Tooltip */}
      <div
        className={`
          absolute -top-10 left-1/2 -translate-x-1/2
          px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
          pointer-events-none select-none
          transition-all duration-200
          ${
            copied
              ? "bg-green-500/90 text-white opacity-100 translate-y-0"
              : "bg-black/80 text-amber-200 border border-amber-500/30 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
          }
        `}
      >
        {copied ? "✓ Скопировано!" : "Нажмите, чтобы скопировать"}
 
        {/* Tooltip arrow */}
        <span
          className={`
            absolute top-full left-1/2 -translate-x-1/2
            border-4 border-transparent
            ${copied ? "border-t-green-500/90" : "border-t-black/80"}
          `}
        />
      </div>
 
      {/* Main button */}
      <button
        onClick={handleCopy}
        className={`
          inline-flex items-center gap-3
          bg-black/40 border rounded-xl px-8 py-4
          cursor-pointer select-none
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60
          ${
            copied
              ? "border-green-500/50 bg-green-500/10"
              : "border-amber-500/20 hover:border-amber-500/50 hover:bg-black/60 active:scale-[0.98]"
          }
        `}
        aria-label={`Скопировать адрес ${value}`}
      >
        <code
          className={`
            text-xl md:text-2xl tracking-widest transition-colors duration-200
            ${copied ? "text-green-400" : "text-amber-300"}
          `}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </code>
 
        {/* Icon */}
        <span className={`transition-all duration-200 ${copied ? "text-green-400" : "text-amber-500/60 group-hover:text-amber-400"}`}>
          {copied ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}
 
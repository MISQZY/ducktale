"use client";

export default function Logo() {
  return (
    <div className="flex items-center gap-3 group" aria-label="DuckTale home">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/40 text-xl transition-colors group-hover:border-amber-400/70">
        🦆
      </div>
      <span
        className="text-lg font-bold tracking-wider text-amber-400"
        style={{ fontFamily: "var(--font-display)" }}
      >
        DuckTale
      </span>
    </div>
  );
}
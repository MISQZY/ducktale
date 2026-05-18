"use client";

import Svg from "./Svg";

export default function Logo() {
  return (
    <div className="flex items-center gap-3 group" aria-label="DuckTale home">
      <div className="flex h-9 w-9 items-center justify-center text-xl transition-colors group-hover:border-amber-400/70">
        <Svg src="/icons/logo.svg" className="text-amber-400" width={36} height={36} />
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
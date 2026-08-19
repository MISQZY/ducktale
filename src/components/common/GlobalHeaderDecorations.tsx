"use client";

import { usePathname } from "next/navigation";
import { HeaderVines } from "@/components/common/HeaderVines";
import { PageBackground } from "@/components/common/PageBackground";

export function GlobalHeaderDecorations() {
  const pathname = usePathname();
  
  // Exclude homepage (matches '/', '/ru', '/en', etc) because it renders its own HeroSection with glows.
  const isHome = pathname === "/" || pathname.match(/^\/[a-z]{2}$/);

  return (
    <>
      <HeaderVines />
      
      {!isHome && (
        <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none overflow-hidden z-0">
          <PageBackground showGlows={false} showFog={true} />
        </div>
      )}
    </>
  );
}

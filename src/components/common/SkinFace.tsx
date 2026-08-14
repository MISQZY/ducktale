import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkinFaceProps {
  skinUrl: string | null;
  size?: number;
  /** Overrides the default rounded-xl corners (e.g. "rounded-none" for a tighter spot like the nav bar, where rounded-xl on a small box reads as a circle). */
  className?: string;
}

/** Crops the head (+ hat layer) from a 64×64 Minecraft skin texture, CSS-only. */
export function SkinFace({ skinUrl, size = 88, className }: SkinFaceProps) {
  if (!skinUrl) {
    return (
      <div
        className={cn("flex items-center justify-center shrink-0 rounded-xl ring-1 ring-inset ring-primary/20 bg-muted", className)}
        style={{ width: size, height: size }}
      >
        <UserRound size={size * 0.4} className="text-foreground/25" />
      </div>
    );
  }

  // Source texture is 64×64. Scaling the whole 64px texture up by (size/8)
  // makes one source pixel = size/8 display px, so background-size is 8×size
  // and a region's offset is -(sourceX * size/8), -(sourceY * size/8).
  // Head:  8:08–15:15 inclusive → offset (-size, -size).
  // Mask: 40:08–47:15 inclusive → offset (-5×size, -size), rendered on top.
  const bgSize = `${size * 8}px auto`;
  const headPos = `${-size}px ${-size}px`;
  const maskPos = `${-5 * size}px ${-size}px`;

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-xl ring-1 ring-inset ring-primary/20 bg-muted", className)}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${skinUrl})`, backgroundSize: bgSize, backgroundPosition: headPos }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${skinUrl})`, backgroundSize: bgSize, backgroundPosition: maskPos }}
      />
    </div>
  );
}

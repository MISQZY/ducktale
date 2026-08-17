"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { GiCube } from "react-icons/gi";
import { Footprints, Hand } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { EmbedPage } from "@/components/docs";
import { cn } from "@/lib/utils";
import { nameColorSolid } from "@/lib/name-color";
import type { PlayerColor } from "@/types/player-card";
import type { SkinAnimationKey } from "./SkinViewer3D";

import { Skeleton } from "@/components/ui/skeleton";

const SkinViewer3D = dynamic(() => import("./SkinViewer3D"), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-none opacity-20" />
});

interface SkinViewButtonProps {
  skinUrl: string | null;
  nickname: string;
  className?: string;
  /** The same chat-color the player card's own background is tinted with (nameColorStyle, DuckCard's `style` in ProfilePlayerCard.tsx) — carried into the 3D viewer so it doesn't suddenly go back to a plain card background once opened. Optional: callers that don't render a colored card (e.g. docs/PlayerCard.tsx) simply leave the viewer background untinted. */
  nameColor?: PlayerColor | null;
}

// Same outline icon-button convention as ProfileQuickActions' link/admin/
// sign-out row (buttonVariants "icon" + bg-card/60) — this is meant to read
// as one of that same family of buttons, just anchored to the card's own
// top-right corner instead of sitting in a header row.
const buttonClasses = cn(buttonVariants({ variant: "outline", size: "icon" }), "bg-card/60");

// Opaque gray, not the translucent bg-card/60 above — these sit directly
// over the 3D scene (not a card's own backdrop-blur surface), where a
// see-through button let the model show through and read as washed out.
const animationButtonClasses = cn(buttonVariants({ variant: "outline", size: "icon" }), "bg-stone-800");

/**
 * Pins to the card's top-right corner (the card itself must be `relative`,
 * e.g. DuckCard already is) — opens EmbedPage in modalMode, which renders
 * straight into its fullscreen/centered state (see ImageViewer.tsx for the
 * same pattern) rather than a small inline embed. Zooming is skinview3d's
 * own OrbitControls (scroll to zoom, drag to rotate), not a separate
 * pan/zoom UI. Renders nothing when there's no skin to show, same as
 * SkinFace's own no-skin fallback implies there'd be nothing to view.
 */
export function SkinViewButton({ skinUrl, nickname, className, nameColor }: SkinViewButtonProps) {
  const t = useTranslations("PlayerCard");
  const [open, setOpen] = useState(false);
  // Toggle, not two independent switches — skinview3d plays exactly one
  // PlayerAnimation at a time (see SkinViewer3D's `animation` prop), so
  // "walking" and "wave" are mutually exclusive; clicking the already-active
  // one returns to a plain idle stance rather than doing nothing.
  const [animation, setAnimation] = useState<SkinAnimationKey>("idle");

  if (!skinUrl) return null;

  // Flattened to one opaque hex (not nameColorStyle's translucent CSS
  // gradient) — see SkinViewer3D's own doc comment for why a WebGL scene
  // background can't just reuse that. Also applied as this wrapper's own
  // CSS background-color, painted instantly on open instead of staying
  // black until skinview3d finishes constructing the renderer.
  const solidColor = nameColorSolid(nameColor);

  function toggleAnimation(key: SkinAnimationKey) {
    setAnimation((prev) => (prev === key ? "idle" : key));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("view3D")}
        title={t("view3D")}
        className={cn(buttonClasses, "absolute top-3 right-3 z-10", className)}
      >
        <GiCube size={16} />
      </button>
      <EmbedPage modalMode open={open} onOpenChange={setOpen} title={nickname} height={420}>
        <div className="absolute inset-0" style={solidColor ? { backgroundColor: solidColor } : undefined}>
          <SkinViewer3D skinUrl={skinUrl} background={solidColor} animation={animation} />

          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => toggleAnimation("walking")}
              aria-label={t("animationWalking")}
              aria-pressed={animation === "walking"}
              title={t("animationWalking")}
              className={cn(
                animationButtonClasses,
                animation === "walking" && "border-primary/60 bg-primary/25 text-primary"
              )}
            >
              <Footprints size={16} />
            </button>
            <button
              type="button"
              onClick={() => toggleAnimation("wave")}
              aria-label={t("animationWave")}
              aria-pressed={animation === "wave"}
              title={t("animationWave")}
              className={cn(
                animationButtonClasses,
                animation === "wave" && "border-primary/60 bg-primary/25 text-primary"
              )}
            >
              <Hand size={16} />
            </button>
          </div>
        </div>
      </EmbedPage>
    </>
  );
}

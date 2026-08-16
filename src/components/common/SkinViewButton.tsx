"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { GiCube } from "react-icons/gi";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { EmbedPage } from "@/components/docs";
import { cn } from "@/lib/utils";

const SkinViewer3D = dynamic(() => import("./SkinViewer3D"), { ssr: false });

interface SkinViewButtonProps {
  skinUrl: string | null;
  nickname: string;
  className?: string;
}

// Same outline icon-button convention as ProfileQuickActions' link/admin/
// sign-out row (buttonVariants "icon" + bg-card/60) — this is meant to read
// as one of that same family of buttons, just anchored to the card's own
// top-right corner instead of sitting in a header row.
const buttonClasses = cn(buttonVariants({ variant: "outline", size: "icon" }), "bg-card/60");

/**
 * Pins to the card's top-right corner (the card itself must be `relative`,
 * e.g. DuckCard already is) — opens EmbedPage in modalMode, which renders
 * straight into its fullscreen/centered state (see ImageViewer.tsx for the
 * same pattern) rather than a small inline embed. Zooming is skinview3d's
 * own OrbitControls (scroll to zoom, drag to rotate), not a separate
 * pan/zoom UI. Renders nothing when there's no skin to show, same as
 * SkinFace's own no-skin fallback implies there'd be nothing to view.
 */
export function SkinViewButton({ skinUrl, nickname, className }: SkinViewButtonProps) {
  const t = useTranslations("PlayerCard");
  const [open, setOpen] = useState(false);

  if (!skinUrl) return null;

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
        <SkinViewer3D skinUrl={skinUrl} />
      </EmbedPage>
    </>
  );
}

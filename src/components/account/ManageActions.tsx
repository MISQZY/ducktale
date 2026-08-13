"use client";

import { useState } from "react";
import { RefreshCw, Unlink2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { unlinkAccount } from "@/lib/actions/account-link";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ManageActionsProps {
  lang: string;
  unlinkLabel: string;
}

const iconButtonClasses = cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "bg-card/70 backdrop-blur-sm");

/**
 * The only client-side piece of the player card — relink navigates to the
 * /account/link flow; unlink calls the same server action the old dashboard
 * "Minecraft account" card used, then refreshes so the server-rendered link
 * status (and this card's visibility) catches up. Split out of
 * ProfilePlayerCard so that component can be a plain Server Component.
 */
export function ManageActions({ lang, unlinkLabel }: ManageActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleUnlink() {
    setPending(true);
    try {
      await unlinkAccount(lang);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleUnlink}
        disabled={pending}
        className={cn(iconButtonClasses, "hover:text-destructive hover:border-destructive/40")}
        aria-label={unlinkLabel}
        title={unlinkLabel}
      >
        <Unlink2 size={14} />
      </button>
    </div>
  );
}

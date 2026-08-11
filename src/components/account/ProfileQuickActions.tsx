"use client";

import { signOut } from "next-auth/react";
import { UserRound, ShieldCheck, LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ProfileQuickActionsProps {
  lang: string;
  publicProfileHref: string;
  isAdmin: boolean;
  viewProfileLabel: string;
  adminPanelLabel: string;
  signOutLabel: string;
}

const iconButtonClasses = cn(buttonVariants({ variant: "outline", size: "icon" }), "bg-card/60");

/**
 * Uses next-auth/react's client signOut (not the server-side one from
 * @/auth) specifically because it updates SessionProvider's context
 * immediately — a server-action sign-out clears the cookie and redirects
 * fine, but any already-mounted useSession() consumer (e.g. the nav bar)
 * has no way to learn about it short of a hard refresh.
 */
export function ProfileQuickActions({
  lang,
  publicProfileHref,
  isAdmin,
  viewProfileLabel,
  adminPanelLabel,
  signOutLabel,
}: ProfileQuickActionsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Link href={publicProfileHref} className={iconButtonClasses} aria-label={viewProfileLabel} title={viewProfileLabel}>
        <UserRound size={16} />
      </Link>
      {isAdmin && (
        <Link href="/admin" className={iconButtonClasses} aria-label={adminPanelLabel} title={adminPanelLabel}>
          <ShieldCheck size={16} />
        </Link>
      )}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: `/${lang}` })}
        className={cn(iconButtonClasses, "hover:text-destructive hover:border-destructive/40")}
        aria-label={signOutLabel}
        title={signOutLabel}
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { UserRound, ShieldCheck, LogOut, Link as LinkIcon, Unlink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { unlinkAccount } from "@/lib/actions/account-link";
import { invalidateAvatarCache } from "@/lib/avatar-cache";
import { cn } from "@/lib/utils";

interface ProfileQuickActionsProps {
  lang: string;
  publicProfileHref: string;
  /** Whether the viewer can open at least one /admin nav tab — see hasAdminNavAccess's doc comment (src/lib/admin.ts). Broader than the raw User.isAdmin flag. */
  canAccessAdmin: boolean;
  viewProfileLabel: string;
  adminPanelLabel: string;
  signOutLabel: string;
  /** Whether the Minecraft account link is CONFIRMED — switches this row's link/unlink button between the two states below. */
  isLinked: boolean;
  /** Where the "not linked" button sends the user — /account/link. */
  linkHref: string;
  linkLabel: string;
  unlinkLabel: string;
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
  canAccessAdmin,
  viewProfileLabel,
  adminPanelLabel,
  signOutLabel,
  isLinked,
  linkHref,
  linkLabel,
  unlinkLabel,
}: ProfileQuickActionsProps) {
  const router = useRouter();
  const [unlinkPending, setUnlinkPending] = useState(false);

  async function handleUnlink() {
    setUnlinkPending(true);
    try {
      await unlinkAccount(lang);
      invalidateAvatarCache();
      router.refresh();
    } finally {
      setUnlinkPending(false);
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Link href={publicProfileHref} className={iconButtonClasses} aria-label={viewProfileLabel} title={viewProfileLabel}>
        <UserRound size={16} />
      </Link>
      {canAccessAdmin && (
        <Link href="/admin" className={iconButtonClasses} aria-label={adminPanelLabel} title={adminPanelLabel}>
          <ShieldCheck size={16} />
        </Link>
      )}
      {isLinked ? (
        <button
          type="button"
          onClick={handleUnlink}
          disabled={unlinkPending}
          className={cn(
            iconButtonClasses,
            "border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
            "hover:text-destructive hover:border-destructive/40 dark:hover:text-destructive dark:hover:border-destructive/40"
          )}
          aria-label={unlinkLabel}
          title={unlinkLabel}
        >
          <Unlink size={16} />
        </button>
      ) : (
        <Link
          href={linkHref}
          className={cn(iconButtonClasses, "animate-pulse border-destructive/50 text-destructive")}
          aria-label={linkLabel}
          title={linkLabel}
        >
          <LinkIcon size={16} />
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

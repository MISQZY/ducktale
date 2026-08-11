"use client";

import { signOut } from "next-auth/react";
import { FormButton } from "@/components/common/FormButton";

/**
 * Uses next-auth/react's client signOut (not the server-side one from
 * @/auth) specifically because it updates SessionProvider's context
 * immediately — a server-action sign-out clears the cookie and redirects
 * fine, but any already-mounted useSession() consumer (e.g. the nav bar)
 * has no way to learn about it short of a hard refresh, since nothing
 * tells the client-side session context it's gone stale.
 */
export function SignOutButton({ label, lang }: { label: string; lang: string }) {
  return (
    <FormButton
      type="button"
      variant="outline"
      onClick={() => signOut({ callbackUrl: `/${lang}` })}
    >
      {label}
    </FormButton>
  );
}

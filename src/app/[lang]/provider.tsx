"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import { SessionProvider } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { FUMADOCS_RU_TRANSLATIONS } from "@/i18n/fumadocs-translations";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import DuckyPet from "@/components/DuckyPet";
import DuckySwarm from "@/components/DuckySwarm";

export function AppProvider({
  children,
  lang,
  session,
}: {
  children: ReactNode;
  lang: string;
  session: Session | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SessionProvider session={session}>
      <RootProvider
        theme={{ enabled: false }}
        i18n={{
          locale: lang,
          locales: [
            { locale: "ru", name: "Русский" },
            { locale: "en", name: "English" },
          ],
          translations: lang === "ru" ? FUMADOCS_RU_TRANSLATIONS : undefined,
          onLocaleChange: (v) => {
            // Use next-intl router to properly handle locale switching (with "as-needed" prefix)
            router.push(pathname, { locale: v });
          },
        }}
      >
        {children}
        <DuckyPet />
        <DuckySwarm />
      </RootProvider>
    </SessionProvider>
  );
}

"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import { useRouter, usePathname } from "@/i18n/navigation";
import { FUMADOCS_RU_TRANSLATIONS } from "@/i18n/fumadocs-translations";
import type { ReactNode } from "react";

export function AppProvider({
  children,
  lang,
}: {
  children: ReactNode;
  lang: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
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
    </RootProvider>
  );
}

import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { ErrorView } from "@/components/common/ErrorView";

export const metadata: Metadata = {
  title: "DuckTale - 404",
  description: "The page you're looking for doesn't exist.",
};

type Locale = (typeof routing.locales)[number];

// This file bypasses the [lang] layout entirely (see Next.js global-not-found
// docs), so there's no route param and no NextIntlClientProvider to read a
// locale from. Best-effort guess from the locale cookie next-intl's own
// middleware sets, falling back to the browser's Accept-Language header.
async function resolveLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  if (routing.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.trim();
  if (routing.locales.includes(preferred as Locale)) {
    return preferred as Locale;
  }

  return routing.defaultLocale;
}

export default async function GlobalNotFound() {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "NotFound" });

  return (
    <html
      lang={locale}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-display: 'Cinzel Decorative', Georgia, serif;
            --font-body: 'Lora', Georgia, serif;
            --font-mono: 'JetBrains Mono', monospace;
          }
        `}} />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <ErrorView
          code="404"
          badge={t("badge")}
          heading={t("heading")}
          description={t("description")}
          ctaHomeLabel={t("ctaHome")}
          homeHref={`/${locale}`}
          footer={
            <div className="flex items-center gap-3 text-xs text-foreground/30">
              {routing.locales.map((loc, i) => (
                <span key={loc} className="flex items-center gap-3">
                  {i > 0 && <span className="text-foreground/15">/</span>}
                  <a
                    href={`/${loc}`}
                    className={cn(
                      "hover:text-primary/70 transition-colors uppercase tracking-wider",
                      loc === locale && "text-primary/60"
                    )}
                  >
                    {loc}
                  </a>
                </span>
              ))}
            </div>
          }
        />
      </body>
    </html>
  );
}

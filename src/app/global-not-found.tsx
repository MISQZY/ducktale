import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Cinzel_Decorative, Lora, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SERVERS } from "@/config/servers";
import { routing } from "@/i18n/routing";
import { NotFoundView } from "@/components/common/NotFoundView";

const fontDisplay = Cinzel_Decorative({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const fontBody = Lora({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-body",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const fontMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  fallback: ["monospace"],
});

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
  const [t, tServers] = await Promise.all([
    getTranslations({ locale, namespace: "NotFound" }),
    getTranslations({ locale, namespace: "Servers" }),
  ]);

  return (
    <html
      lang={locale}
      className={cn(fontDisplay.variable, fontBody.variable, fontMono.variable)}
    >
      <body className="bg-background text-foreground antialiased min-h-screen">
        <NotFoundView
          badge={t("badge")}
          heading={t("heading")}
          description={t("description")}
          ctaHomeLabel={t("ctaHome")}
          ctaServersLabel={t("ctaServers")}
          docsHint={t("docsHint")}
          homeHref={`/${locale}`}
          serversHref={`/${locale}#servers`}
          servers={SERVERS.map((server) => ({
            id: server.id,
            emoji: server.emoji,
            name: server.name,
            tagline: tServers(`items.${server.id}.tagline`),
            href: `/${locale}${server.href}`,
          }))}
          footer={
            <div className="flex items-center gap-3 text-xs text-foreground/30">
              {routing.locales.map((loc, i) => (
                <span key={loc} className="flex items-center gap-3">
                  {i > 0 && <span className="text-foreground/15">/</span>}
                  <Link
                    href={`/${loc}`}
                    className={cn(
                      "hover:text-primary/70 transition-colors uppercase tracking-wider",
                      loc === locale && "text-primary/60"
                    )}
                  >
                    {loc}
                  </Link>
                </span>
              ))}
            </div>
          }
        />
      </body>
    </html>
  );
}

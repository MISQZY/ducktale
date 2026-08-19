"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { ErrorView } from "@/components/common/ErrorView";

type Locale = (typeof routing.locales)[number];

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // We don't have cookies/headers easily available synchronously in a Client Component.
  // We'll fall back to the default locale.
  const locale = routing.defaultLocale;

  return (
    <html lang={locale}>
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
          code="500"
          badge="Ошибка сервера"
          heading="Сервер временно недоступен"
          description="Наши сервисы или база данных в данный момент недоступны. Пожалуйста, повторите попытку позже."
          ctaHomeLabel="Вернуться на главную"
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

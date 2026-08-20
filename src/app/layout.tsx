/* eslint-disable */
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE } from "@/config/site";

const fontMinecraft = localFont({
  src: [
    { path: "../../public/fonts/MojanglesNormal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/MojanglesBold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-minecraft",
  display: "swap",
  fallback: ["monospace"],
});

const siteURL = new URL(SITE.url);

export const metadata: Metadata = {
  metadataBase: siteURL,
  icons: {
    icon: "/icons/favicon.svg",
  },
  title: {
    template: "DuckTale - %s",
    default: "DuckTale",
  },
  description:
    "DuckTale — сеть Minecraft серверов. DuckBurg — сервер выживания, DuckHood — сервер творчества.",
  openGraph: {
    title: "DuckTale",
    description:
      "DuckTale — сеть Minecraft серверов. DuckBurg — выживание, DuckHood — творчество.",
    url: siteURL,
    siteName: "DuckTale",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/icons/favicon.svg",
        width: 1200,
        height: 630,
        alt: "DuckTale",
      },
    ],
  },
};

import { getLocale } from "next-intl/server";

import { MouseTracker } from "@/components/common/MouseTracker";
import { Toaster } from "@/components/ui/sonner";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(
        "scroll-smooth scroll-pt-16",
        fontMinecraft.variable
      )}
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
      <body suppressHydrationWarning className="bg-background text-foreground antialiased min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          value={{ light: "light", dark: "dark" }}
          disableTransitionOnChange
        >
          {children}
          <MouseTracker />
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

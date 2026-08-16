import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Cinzel_Decorative, Lora, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE } from "@/config/site";

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
        fontDisplay.variable,
        fontBody.variable,
        fontMono.variable,
        fontMinecraft.variable
      )}
    >
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

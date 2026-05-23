import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider";
import { Cinzel_Decorative, Crimson_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ServerStatusProvider } from "@/context/ServerStatusContext";

const fontDisplay = Cinzel_Decorative({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontBody = Crimson_Pro({
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteURL = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  )

export const metadata: Metadata = {
  metadataBase: siteURL,
  icons: {
    icon: "/icons/favicon.svg",
  },
  title: {
    template: "%s | DuckTale",
    default: "DuckTale — Minecraft Network",
  },
  description:
    "DuckTale — сеть Minecraft серверов. DuckBurg — сервер выживания, DuckHood — сервер творчества.",
  openGraph: {
    title: "DuckTale — Minecraft Network",
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
        alt: "DuckTale — Minecraft Network",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      data-scroll-behavior="smooth" 
      className={cn(
        "scroll-pt-16",
        fontDisplay.variable,
        fontBody.variable,
        fontMono.variable
      )}
    >
      <body>
        <RootProvider theme={{ defaultTheme: "dark", forcedTheme: "dark" }}>
          {/* ServerStatusProvider*/}
          <ServerStatusProvider>{children}</ServerStatusProvider>
        </RootProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider";
import { Cinzel_Decorative, Crimson_Pro, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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

export const metadata: Metadata = {
  icons: {
    icon: "icons/favicon.svg",
  },
  title: {
    template: "%s",
    default: "DuckTale — Minecraft Network",
  },
  description:
    "DuckTale — сеть Minecraft серверов. DuckBurg — сервер выживания, DuckHood — сервер творчества.",
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
      className={cn("scroll-pt-16", fontDisplay.variable, fontBody.variable, fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <RootProvider theme={{
          defaultTheme: "dark",
          forcedTheme: "dark",
        }}>{children}</RootProvider>
      </body>
    </html>
  );
}

import { createMDX } from "fumadocs-mdx/next";
import createNextIntlPlugin from "next-intl/plugin";

const withMDX = createMDX();
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Clamped independently of src/lib/tickets.ts's own copy of these bounds
// (that file can't be imported here — it pulls in auth.ts) — this is the
// outer Next.js-level cap on every Server Action's request body in the app,
// not just the ticket ones, so it needs its own floor/ceiling regardless of
// what MAX_TICKET_ATTACHMENT_MB is set to.
const MAX_ATTACHMENT_MB = Math.min(Math.max(Number(process.env.MAX_TICKET_ATTACHMENT_MB) || 20, 1), 50);

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    // Lets app/global-not-found.tsx handle every unmatched URL in one place.
    // Needed because the root layout is a top-level dynamic segment
    // (app/[lang]/layout.tsx), so there's no single non-dynamic layout to
    // compose a global 404 from otherwise.
    globalNotFound: true,
    serverActions: {
      bodySizeLimit: `${MAX_ATTACHMENT_MB}mb`,
    },
    optimizePackageImports: ["react-icons", "lucide-react", "@antv/x6"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.modrinth.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "media.forgecdn.net" },
      { protocol: "https", hostname: "drive.google.com" },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [50, 60, 70, 75, 80, 85, 90, 100],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },
};

export default withNextIntl(withMDX(nextConfig));

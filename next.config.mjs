import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "standalone",
   images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [50, 60, 70, 75, 80, 85, 90, 100],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default withMDX(config);

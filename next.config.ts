import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  // Prisma as external package
  serverExternalPackages: ['@prisma/client'],
  
  // Enable experimental features for speed
  experimental: {
    optimizePackageImports: ['lucide-react', 'ri'],
  },
};

// Schema updated: 4 policy pages (about, terms, privacy, refund)
export default nextConfig;

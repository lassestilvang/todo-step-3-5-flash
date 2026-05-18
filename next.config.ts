import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // keep only practical srcset pixel widths (16/32/48 px are rarely used)
    imageSizes: [64, 128, 256, 384],
  },

  // Output configuration for containerized deployments
  output: 'standalone',

  // trailingSlash: false is the default for App Router

  // Allow native module in server components
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;

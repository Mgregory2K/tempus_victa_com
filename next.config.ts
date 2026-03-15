import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'export',      // Required for Capacitor static ingestion
  images: {
    unoptimized: true,   // Mobile apps use local assets, not a remote image server
  },
  /* allowedDevOrigins is for development only. Production builds require standard origin management. */
};

export default nextConfig;

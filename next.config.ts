import type { NextConfig } from "next";

const isTerminalMode = process.env.NEXT_PUBLIC_TERMINAL_MODE === 'true';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: isTerminalMode ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  // BUILD SHIELD: Bypass static analysis for the shielded API during Terminal export
  typescript: {
    ignoreBuildErrors: isTerminalMode,
  },
  eslint: {
    ignoreDuringBuilds: isTerminalMode,
  },
  /* allowedDevOrigins is for development only. Production builds require standard origin management. */
};

export default nextConfig;

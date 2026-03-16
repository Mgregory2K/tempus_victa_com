import type { NextConfig } from "next";

const isTerminalMode = process.env.NEXT_PUBLIC_TERMINAL_MODE === 'true';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: isTerminalMode ? 'export' : undefined,
  images: {
    unoptimized: true,
  }
};

export default nextConfig;

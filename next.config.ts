import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Allow requests from the local network
    allowedDevOrigins: ["http://192.168.40.250:3000"],
  },
};

export default nextConfig;

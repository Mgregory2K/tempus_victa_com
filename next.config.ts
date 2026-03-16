import type { NextConfig } from "next";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * SOVEREIGN ENVIRONMENT LOADER
 * Manually injects .env.local.dev into process.env before Next.js initializes.
 * This bypasses Node CLI --env-file worker propagation issues.
 */
const envPath = join(process.cwd(), ".env.local.dev");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      process.env[key.trim()] = value;
    }
  });
}

const nextConfig: NextConfig = {
  // Removed 'output: export' because the system requires a server-side runtime
  // for Next-Auth, Google API sync, and dynamic API routes.
  reactCompiler: true,
  images: {
    unoptimized: true,
  }
};

export default nextConfig;

import { NextResponse } from "next/server";
import { KeyRegistry } from "@/core/twin_plus/crypto/key_registry";

// Instruct Next.js that this route can be statically generated during export
export const dynamic = 'force-static';

export async function GET() {
  const registry = KeyRegistry.getInstance();
  const publicKeys = registry.getAllPublicKeys();

  return NextResponse.json({
    keys: publicKeys,
  });
}

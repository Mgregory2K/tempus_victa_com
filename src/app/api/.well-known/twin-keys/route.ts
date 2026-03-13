import { NextResponse } from "next/server";
import { KeyRegistry } from "@/src/core/twin_plus/crypto/key_registry";

export async function GET() {
  const registry = KeyRegistry.getInstance();
  const publicKeys = registry.getAllPublicKeys();

  return NextResponse.json({
    keys: publicKeys,
  });
}

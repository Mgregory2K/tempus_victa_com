import { NextResponse } from "next/server";
import { resolveOrCreateTwinManifest } from "@/src/core/twin_plus/google_identity_bridge";
import { loadTwinMemory } from "@/src/core/twin_plus/twin_memory";

function getAuthenticatedGoogleEmail(): string {
  // Replace this with your real Google session user email.
  // Example:
  // const session = await auth();
  // return session?.user?.email ?? "";
  return "michael.gregory1@gmail.com";
}

export async function POST() {
  try {
    const email = getAuthenticatedGoogleEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const manifest = resolveOrCreateTwinManifest(email);
    const memory = loadTwinMemory();

    return NextResponse.json({
      ok: true,
      twin_id: manifest.twin_id,
      owner_email: manifest.owner_email,
      memory_summary: {
        durable_fact_keys: Object.keys(memory.durable_facts),
        preference_keys: Object.keys(memory.preferences),
        pattern_count: memory.behavioral_patterns.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

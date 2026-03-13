import { NextResponse } from "next/server";
import { resolveOrCreateTwinManifest } from "@/core/twin_plus/google_identity_bridge";
import { loadTwinMemory } from "@/core/twin_plus/twin_memory";
import { buildTwinPassport } from "@/core/twin_plus/twin_passport";
import { ProjectionScope } from "@/core/twin_plus/scopes";

function getAuthenticatedGoogleEmail(): string {
  return "michael.gregory1@gmail.com";
}

export async function POST(request: Request) {
  try {
    const email = getAuthenticatedGoogleEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      scope?: ProjectionScope;
    };

    const scope = body.scope ?? "ai_chat_compact";

    const manifest = resolveOrCreateTwinManifest(email);
    const memory = loadTwinMemory();
    const passport = buildTwinPassport(manifest, memory, scope);

    return NextResponse.json({
      ok: true,
      passport,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

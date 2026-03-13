import { NextResponse } from "next/server";
import { GrantRegistry } from "@/core/twin_plus/grants/grant_registry";

function getAuthenticatedGoogleEmail(): string {
  return "michael.gregory1@gmail.com";
}

export async function GET() {
  try {
    const email = getAuthenticatedGoogleEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real app, resolve email to twin_id
    const twin_id = "tv_placeholder_id";

    const grants = GrantRegistry.getInstance();
    const list = grants.getGrantsForTwin(twin_id);

    return NextResponse.json({
      ok: true,
      grants: list,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

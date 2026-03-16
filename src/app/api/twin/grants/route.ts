import { NextResponse } from "next/server";
import { GrantRegistry } from "@/core/twin_plus/grants/grant_registry";

/**
 * TWIN GRANTS API
 * Standard dynamic route for managing sovereign permissions.
 */

// This marks the route as dynamic so it's not converted to a static JSON during 'output: export'
// Although we've removed 'output: export' from next.config.ts, this is still best practice for dynamic APIs.
export const dynamic = 'force-dynamic';

function getAuthenticatedGoogleEmail(): string {
  // This would typically come from the session in a real deployment
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

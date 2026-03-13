import { NextResponse } from "next/server";
import { RevocationRegistry } from "@/core/twin_plus/revocation/revocation_registry";
import { GrantRegistry } from "@/core/twin_plus/grants/grant_registry";

export async function POST(request: Request) {
  try {
    const { type, id, reason } = (await request.json()) as {
      type: "key" | "passport" | "grant";
      id: string;
      reason: string;
    };

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    const revocation = RevocationRegistry.getInstance();
    revocation.revoke(type, id, reason || "user_requested");

    if (type === "grant") {
      const grants = GrantRegistry.getInstance();
      grants.revokeGrant(id);
    }

    return NextResponse.json({
      ok: true,
      message: `${type} ${id} revoked successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

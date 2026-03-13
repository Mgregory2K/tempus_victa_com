import { NextResponse } from "next/server";
import { exportTwinPassport } from "@/core/twin_plus/export/passport_export";
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

    const passport = exportTwinPassport(email, body.scope);

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

import { NextResponse } from "next/server";
import { exportTwinPassport } from "@/src/core/twin_plus/export/passport_export";
import { renderTwinContextEnvelope } from "@/src/core/twin_plus/export/envelope";
import { ProjectionScope } from "@/src/core/twin_plus/scopes";

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
    const envelope = renderTwinContextEnvelope(passport);

    return NextResponse.json({
      ok: true,
      envelope,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

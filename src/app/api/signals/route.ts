import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Temporary bypass for scope mismatch error to stabilize Holodeck UI
  return NextResponse.json({ ok: true, signals: [] });
}

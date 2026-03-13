import { NextResponse } from "next/server";
import { getIssuerMetadata } from "@/src/core/twin_plus/protocol/issuer_metadata";

export async function GET() {
  return NextResponse.json(getIssuerMetadata());
}

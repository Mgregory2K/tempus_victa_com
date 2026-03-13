import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    spec_name: "Twin Passport Protocol",
    version: "v2.0-phase3",
    status: "draft_implementation",
    description: "A protocol for verifiable, scoped, and revocable cognitive identity assertions.",
    core_concepts: [
      "Asymmetric Ed25519 Signing",
      "Short-lived Passports",
      "Explicit Audience Scoping",
      "Verifiable Consent Grants",
      "Public Key Keyrings"
    ],
    endpoints: {
      issuer: "/api/.well-known/twin-issuer",
      keys: "/api/.well-known/twin-keys",
      verify: "/api/twin/verify"
    }
  });
}

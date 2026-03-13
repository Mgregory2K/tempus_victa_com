import { NextResponse } from "next/server";
import { verifyPassportAsymmetric } from "@/src/core/twin_plus/crypto/verify_passport";
import { TwinPassport } from "@/src/core/twin_plus/identity_model";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passport, expectedAudience } = body as {
      passport: TwinPassport;
      expectedAudience?: string;
    };

    if (!passport) {
      return NextResponse.json({ error: "Missing passport" }, { status: 400 });
    }

    const result = await verifyPassportAsymmetric(passport, expectedAudience);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

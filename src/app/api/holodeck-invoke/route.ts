import { NextRequest, NextResponse } from "next/server";
import { buildParticipantProfile } from "@/lib/holodeck/profileBuilder";
import { getCachedProfile, saveProfile, resolveEntityId } from "@/lib/holodeck/profileStore";

export async function POST(req: NextRequest) {
  console.log("[HOLODECK INVOKE] Concurrent build route triggered");
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

    const { members, apiKey } = body;
    if (!apiKey) return NextResponse.json({ ok: false, error: "API Key missing" }, { status: 400 });
    if (!members || !Array.isArray(members)) return NextResponse.json({ ok: false, error: "Members missing" }, { status: 400 });

    const profilePromises = members.map(async (name) => {
      const id = resolveEntityId(name);
      let profile = getCachedProfile(id);

      if (!profile) {
        console.log(`[HOLODECK INVOKE] Cache miss, building: ${name}`);
        try {
          const result = await buildParticipantProfile(name, apiKey);
          if (!result?.profile) throw new Error("Invalid structure returned");

          saveProfile(result.profile, result.ledger);
          return { success: true, profile: result.profile };
        } catch (e: any) {
          console.error(`[HOLODECK INVOKE] Build failed for ${name}:`, e);
          return { success: false, name, error: e.message || "Build failed" };
        }
      }
      return { success: true, profile };
    });

    const results = await Promise.all(profilePromises);

    const profiles = results.filter(r => r.success).map(r => r.profile);
    const buildErrors = results.filter(r => !r.success);

    return NextResponse.json({
      ok: profiles.length > 0,
      profiles,
      errors: buildErrors.length > 0 ? buildErrors : undefined
    });

  } catch (error: any) {
    console.error("[HOLODECK INVOKE ERROR]", error);
    return NextResponse.json({ ok: false, error: "Server Error" }, { status: 500 });
  }
}

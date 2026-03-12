import { NextRequest, NextResponse } from "next/server";
import { buildParticipantProfile } from "@/lib/holodeck/profileBuilder";
import { getCachedProfile, saveProfile, resolveEntityId } from "@/lib/holodeck/profileStore";

export async function POST(req: NextRequest) {
  console.log("[HOLODECK API] Received invoke request");
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      console.error("[HOLODECK API] Failed to parse request body");
      return NextResponse.json({ ok: false, error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { members, apiKey } = body;

    if (!apiKey) {
      console.error("[HOLODECK API] OpenAI API Key missing");
      return NextResponse.json({ ok: false, error: "OpenAI API Key is missing. Please set it in Config." }, { status: 400 });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      console.error("[HOLODECK API] Members list missing or empty");
      return NextResponse.json({ ok: false, error: "Members list is required" }, { status: 400 });
    }

    const profiles = [];
    const buildErrors = [];

    for (const name of members) {
      const id = resolveEntityId(name);
      console.log(`[HOLODECK API] Processing participant: ${name} (id: ${id})`);

      let profile = null;
      try {
        profile = getCachedProfile(id);
      } catch (cacheErr) {
        console.warn(`[HOLODECK API] Cache check failed for ${name}:`, cacheErr);
      }

      if (!profile) {
        console.log(`[HOLODECK API] Cache miss for ${name}, building profile...`);
        try {
          const result = await buildParticipantProfile(name, apiKey);

          if (!result || !result.profile) {
             console.error(`[HOLODECK API] Model returned invalid structure for ${name}`);
             buildErrors.push({ name, error: "Model returned invalid profile structure." });
             continue;
          }

          // Ensure confidence exists
          if (result.profile.confidence === undefined) result.profile.confidence = 0.85;

          // Minimum Confidence Threshold: 0.72
          if (result.profile.confidence < 0.72) {
            console.warn(`[HOLODECK API] Confidence too low for ${name}: ${result.profile.confidence}`);
            buildErrors.push({ name, error: `Insufficient evidence confidence score (${result.profile.confidence.toFixed(2)}).` });
            continue;
          }

          profile = result.profile;
          saveProfile(result.profile, result.ledger);
          console.log(`[HOLODECK API] Profile built and cached for ${name}`);
        } catch (buildErr: any) {
          console.error(`[HOLODECK API] Failed to build profile for ${name}:`, buildErr);
          buildErrors.push({ name, error: buildErr.message || "Deep research failed." });
          continue;
        }
      } else {
        console.log(`[HOLODECK API] Cache hit for ${name}`);
      }

      if (profile) {
        profiles.push(profile);
      }
    }

    if (profiles.length === 0 && buildErrors.length > 0) {
      console.error("[HOLODECK API] Failed to resolve any valid profiles", buildErrors);
      return NextResponse.json({
        ok: false,
        error: "Could not build any valid participant profiles.",
        details: buildErrors
      }, { status: 422 });
    }

    console.log(`[HOLODECK API] Invocation successful. Resolved ${profiles.length} profiles.`);
    return NextResponse.json({
      ok: true,
      profiles,
      errors: buildErrors.length > 0 ? buildErrors : undefined
    });

  } catch (error: any) {
    console.error("[HOLODECK API] Global error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
